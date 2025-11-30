import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useCallback, useEffect, useState } from 'react';

/**
 * Onboarding Steps in order
 * These must be completed in sequence
 */
export enum OnboardingStep {
  NOT_STARTED = 'not_started',
  CURRENCY = 'currency',
  PRIVACY = 'privacy',
  REMINDERS = 'reminders',
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

  /**
   * Load onboarding state from persistent storage on app launch
   */
  useEffect(() => {
    const loadOnboardingState = async () => {
      try {
        const savedStep = await SecureStore.getItemAsync(STORAGE_KEY);
        console.log('Loaded onboarding step from storage:', savedStep);

        if (savedStep && Object.values(OnboardingStep).includes(savedStep as OnboardingStep)) {
          setCurrentStep(savedStep as OnboardingStep);
        } else {
          // First time user - start onboarding
          setCurrentStep(OnboardingStep.NOT_STARTED);
        }
      } catch (error) {
        console.error('Error loading onboarding state:', error);
        // On error, assume first time user
        setCurrentStep(OnboardingStep.NOT_STARTED);
      } finally {
        setLoading(false);
      }
    };

    loadOnboardingState();
  }, []);

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
      console.log(`[Onboarding] Completed step: ${step}, moving to: ${nextStep}`);
    } catch (error) {
      console.error('[Onboarding] Error completing onboarding step:', error);
      throw error;
    }
  }, [currentStep]);

  /**
   * Skip to a specific step (for testing or recovery)
   */
  const skipToStep = useCallback(async (step: OnboardingStep) => {
    try {
      await SecureStore.setItemAsync(STORAGE_KEY, step);
      setCurrentStep(step);
      console.log('Skipped to onboarding step:', step);
    } catch (error) {
      console.error('Error skipping to step:', error);
      throw error;
    }
  }, []);

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
