import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './Auth';

/**
 * Onboarding Steps in order
 * These must be completed in sequence
 */
export enum OnboardingStep {
  NOT_STARTED = 'not_started',
  CURRENCY = 'currency',
  REMINDERS = 'reminders',
  PRIVACY = 'privacy',
  TUTORIAL = 'tutorial',
  COMPLETED = 'completed',
}

/**
 * Determine the next step in the onboarding flow
 */
const getNextStep = (currentStep: OnboardingStep): OnboardingStep => {
  const sequence = [
    OnboardingStep.NOT_STARTED,
    OnboardingStep.CURRENCY,
    OnboardingStep.PRIVACY,
    OnboardingStep.REMINDERS,
    OnboardingStep.TUTORIAL,
    OnboardingStep.COMPLETED,
  ];

  const currentIndex = sequence.indexOf(currentStep);
  const nextIndex = Math.min(currentIndex + 1, sequence.length - 1);
  return sequence[nextIndex];
};

/**
 * Determine if a step is completed
 */
const isStepCompleted = (step: OnboardingStep): boolean => {
  return step === OnboardingStep.COMPLETED;
};

interface OnboardingContextType {
  // Current state
  currentStep: OnboardingStep | null;
  isOnboardingComplete: boolean;
  loading: boolean;

  // Actions
  startOnboarding: () => Promise<void>;
  completeStep: (step: OnboardingStep) => Promise<void>;
  resetOnboarding: () => Promise<void>;
  skipToStep: (step: OnboardingStep) => Promise<void>;

  // Navigation helpers
  getNextStep: () => OnboardingStep;
  isCurrentStep: (step: OnboardingStep) => boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const STORAGE_KEY = 'onboarding_step';

export const OnboardingProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  /**
   * Sync onboarding state to database
   */
  const syncToDatabase = useCallback(async (step: OnboardingStep) => {
    try {
      if (!user?.id) {
        console.log('[Onboarding] No user, skipping database sync');
        return;
      }

      console.log('[Onboarding] Syncing onboarding step to database:', step);
      
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_step: step })
        .eq('id', user.id);

      if (error) {
        console.error('[Onboarding] Error syncing to database:', error);
      } else {
        console.log('[Onboarding] Successfully synced to database:', step);
      }
    } catch (error) {
      console.error('[Onboarding] Database sync error:', error);
    }
  }, [user?.id]);

  /**
   * Load onboarding state from persistent storage on app launch
   * First tries database (if user exists), then falls back to SecureStore
   */
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        let savedStep: string | null = null;

        // Try to load from database first if user is logged in
        if (user?.id) {
          console.log('[Onboarding] Loading from database for user:', user.id);
          try {
            const { data, error: dbError } = await supabase
              .from('profiles')
              .select('onboarding_step')
              .eq('id', user.id)
              .single();

            if (dbError) {
              console.warn('[Onboarding] Error loading from database:', dbError.message);
            } else if (data?.onboarding_step) {
              savedStep = data.onboarding_step;
              console.log('[Onboarding] Loaded onboarding step from database:', savedStep);
            }
          } catch (error) {
            console.warn('[Onboarding] Database load error:', error);
          }
        }

        // Fall back to SecureStore if no database result
        if (!savedStep) {
          console.log('[Onboarding] Loading from SecureStore');
          savedStep = await SecureStore.getItemAsync(STORAGE_KEY);
          if (savedStep) {
            console.log('[Onboarding] Loaded onboarding step from SecureStore:', savedStep);
          }
        }

        if (savedStep && Object.values(OnboardingStep).includes(savedStep as OnboardingStep)) {
          console.log('[Onboarding] Valid saved step found:', savedStep);
          setCurrentStep(savedStep as OnboardingStep);
        } else {
          // First time user - start onboarding
          console.log('[Onboarding] No valid saved step found. savedStep:', savedStep, 'Valid enum values:', Object.values(OnboardingStep));
          setCurrentStep(OnboardingStep.NOT_STARTED);
        }
      } catch (error) {
        console.error('[Onboarding] Error loading onboarding state:', error);
        // On error, assume first time user
        setCurrentStep(OnboardingStep.NOT_STARTED);
      } finally {
        setLoading(false);
      }
    };

    loadOnboardingState();
  }, [user?.id]);

  /**
   * Start onboarding from the beginning
   */
  const startOnboarding = useCallback(async () => {
    try {
      const nextStep = getNextStep(OnboardingStep.NOT_STARTED);
      await SecureStore.setItemAsync(STORAGE_KEY, nextStep);
      setCurrentStep(nextStep);
      console.log('Onboarding started, moving to step:', nextStep);
    } catch (error) {
      console.error('Error starting onboarding:', error);
      throw error;
    }
  }, []);

  /**
   * Complete a step and move to the next one
   */
  const completeStep = useCallback(async (step: OnboardingStep) => {
    try {
      console.log(`[Onboarding] completeStep called with: ${step}, currentStep is: ${currentStep}`);
      
      // If we're on NOT_STARTED and trying to complete CURRENCY, auto-advance first
      if (currentStep === OnboardingStep.NOT_STARTED && step === OnboardingStep.CURRENCY) {
        console.log('[Onboarding] Auto-advancing from NOT_STARTED to CURRENCY');
        const nextStep = getNextStep(OnboardingStep.NOT_STARTED); // Returns CURRENCY
        await SecureStore.setItemAsync(STORAGE_KEY, nextStep);
        setCurrentStep(nextStep);
        
        // Now complete the currency step
        const finalStep = getNextStep(nextStep); // Returns PRIVACY
        await SecureStore.setItemAsync(STORAGE_KEY, finalStep);
        setCurrentStep(finalStep);
        // Sync to database
        await syncToDatabase(finalStep);
        console.log(`[Onboarding] Completed step: ${step}, moving to: ${finalStep}`);
        return;
      }
      
      // Allow completing step if we're on the current step
      if (step !== currentStep) {
        console.warn(`[Onboarding] Attempting to complete step ${step}, but current step is ${currentStep}`);
        console.log('[Onboarding] Proceeding anyway - state may be in transition');
        // Don't return early - proceed with the step transition
      }

      const nextStep = getNextStep(step);
      await SecureStore.setItemAsync(STORAGE_KEY, nextStep);
      setCurrentStep(nextStep);
      // Sync to database
      await syncToDatabase(nextStep);
      console.log(`[Onboarding] Completed step: ${step}, moving to: ${nextStep}`);
    } catch (error) {
      console.error('[Onboarding] Error completing onboarding step:', error);
      throw error;
    }
  }, [currentStep, syncToDatabase]);

  /**
   * Skip to a specific step (for testing or recovery)
   */
  const skipToStep = useCallback(async (step: OnboardingStep) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, step);
      setCurrentStep(step);
      // Sync to database
      await syncToDatabase(step);
      console.log('Skipped to onboarding step:', step);
    } catch (error) {
      console.error('Error skipping to step:', error);
      throw error;
    }
  }, [syncToDatabase]);

  /**
   * Reset onboarding completely (when user logs out)
   */
  const resetOnboarding = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEY);
      setCurrentStep(OnboardingStep.NOT_STARTED);
      console.log('Onboarding reset');
    } catch (error) {
      console.error('Error resetting onboarding:', error);
      throw error;
    }
  }, []);

  /**
   * Get the next step from current position
   */
  const getNextStepHelper = useCallback(() => {
    if (currentStep === null) return OnboardingStep.NOT_STARTED;
    return getNextStep(currentStep);
  }, [currentStep]);

  /**
   * Check if we're on a specific step
   */
  const isCurrentStepHelper = useCallback(
    (step: OnboardingStep) => currentStep === step,
    [currentStep]
  );

  const isOnboardingComplete = currentStep === OnboardingStep.COMPLETED;

  const value: OnboardingContextType = {
    currentStep,
    isOnboardingComplete,
    loading,
    startOnboarding,
    completeStep,
    resetOnboarding,
    skipToStep,
    getNextStep: getNextStepHelper,
    isCurrentStep: isCurrentStepHelper,
  };

  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};
