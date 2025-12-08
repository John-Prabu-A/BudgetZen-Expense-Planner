import UnifiedLockScreen from '@/components/UnifiedLockScreen';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/Auth';
import { OnboardingProvider, OnboardingStep, useOnboarding } from '../context/Onboarding';
import { PreferencesProvider, usePreferences } from '../context/Preferences';
import { ThemeProvider, useTheme } from '../context/Theme';
import { ToastProvider } from '../context/Toast';

const InitialLayout = () => {
    const { session, loading: authLoading, isPasswordLocked, unlockPassword } = useAuth();
    const { isDark, colors } = useTheme();
    const { authMethod, passwordHash, passcodeHash, passcodeLength } = usePreferences();
    const { currentStep, loading: onboardingLoading } = useOnboarding();
    const router = useRouter();
    const segments = useSegments();
    const navigationReady = useRootNavigationState()?.key;

    // Main navigation logic
    useEffect(() => {
        if (!navigationReady) {
            console.log('Navigation not ready');
            return;
        }

        if (authLoading || onboardingLoading) {
            console.log('Still loading auth or onboarding');
            return;
        }

        if (currentStep === null) {
            console.log('Onboarding step not loaded yet');
            return;
        }

        // If password is locked, don't proceed with navigation
        if (isPasswordLocked) {
            console.log('Password locked - showing password screen');
            return;
        }

        const inAuthGroup = segments[0] === '(auth)';
        const inOnboardingGroup = segments[0] === '(onboarding)';
        const inTabsGroup = segments[0] === '(tabs)';
        const inPreferences = segments[0] === 'preferences';
        const isModal = segments[0] === '(modal)';

        console.log('Navigation logic:', {
            hasSession: !!session,
            isPasswordLocked,
            onboardingStep: currentStep,
            isOnboardingComplete: currentStep === OnboardingStep.COMPLETED,
            inAuthGroup,
            inOnboardingGroup,
            inTabsGroup,
            inPreferences,
            isModal,
            segments,
        });

        // If in modal or preferences, don't change navigation
        if (isModal || inPreferences) {
            return;
        }

        // NO SESSION: User not logged in
        if (!session) {
            if (!inAuthGroup) {
                console.log('[NAV] No session → Redirecting to login');
                router.replace('/(auth)/login');
            }
            return;
        }

        // HAS SESSION: User is logged in

        // If onboarding is not complete, show onboarding
        if (currentStep !== OnboardingStep.COMPLETED) {
            // Map onboarding step to route
            let targetRoute: string = '/(onboarding)/currency';
            
            if (currentStep === OnboardingStep.CURRENCY) {
                targetRoute = '/(onboarding)/currency';
            } else if (currentStep === OnboardingStep.PRIVACY) {
                targetRoute = '/(onboarding)/privacy';
            } else if (currentStep === OnboardingStep.REMINDERS) {
                targetRoute = '/(onboarding)/reminders';
            } else if (currentStep === OnboardingStep.TUTORIAL) {
                targetRoute = '/(onboarding)/tutorial';
            }

            // Get current route from segments
            const currentRoute = segments.slice(1).join('/');
            const targetRouteWithoutGroup = targetRoute.replace('/(onboarding)/', '');

            // Navigate if we're not on the correct screen
            if (currentRoute !== targetRouteWithoutGroup) {
                console.log(`[NAV] Onboarding not complete (step: ${currentStep}) → Redirecting to ${targetRoute}`);
                console.log(`[NAV] Current route: ${currentRoute}, Target: ${targetRouteWithoutGroup}`);
                router.replace(targetRoute as any);
            } else {
                console.log(`[NAV] Already on correct onboarding screen: ${currentRoute}`);
            }
            return;
        }

        // ONBOARDING IS COMPLETE: Show main app
        if (!inTabsGroup) {
            console.log('[NAV] Onboarding complete → Redirecting to main app');
            router.replace('/(tabs)');
        }
    }, [
        session,
        navigationReady,
        authLoading,
        onboardingLoading,
        currentStep,
        isPasswordLocked,
        segments,
    ]);

    // Show loading state while initializing
    if (authLoading || onboardingLoading || currentStep === null || !navigationReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    // Show password lock screen if password is locked
    // Show the appropriate lock screen based on authMethod and available credentials
    if (isPasswordLocked) {
        // If we have password hash, show password lock screen (fallback/default)
        if (passwordHash) {
            return (
                <UnifiedLockScreen
                    authMethod={authMethod === 'passcode' ? 'passcode' : authMethod === 'both' ? 'both' : 'password'}
                    passwordHash={passwordHash}
                    passcodeHash={passcodeHash}
                    passcodeLength={passcodeLength}
                    onUnlock={unlockPassword}
                />
            );
        }
        // If we have passcode hash but no password, show passcode lock screen
        else if (passcodeHash) {
            return (
                <UnifiedLockScreen
                    authMethod="passcode"
                    passcodeHash={passcodeHash}
                    passcodeLength={passcodeLength}
                    onUnlock={unlockPassword}
                />
            );
        }
    }

    return (
        <>
            <StatusBar 
                style={isDark ? 'light' : 'dark'} 
                backgroundColor={colors.background}
                translucent={false}
            />
            <Stack
                screenOptions={{
                    contentStyle: {
                        backgroundColor: colors.background,
                    },
                    headerShown: false,
                }}
            >
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(modal)" options={{ headerShown: false }} />
                <Stack.Screen name="preferences" options={{ headerShown: false }} />
                <Stack.Screen name="passcode-setup" options={{ headerShown: false }} />
            </Stack>
        </>
    );
};

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <AuthProvider>
                <PreferencesProvider>
                    <OnboardingProvider>
                        <ThemeProvider>
                            <ToastProvider>
                                <InitialLayout />
                            </ToastProvider>
                        </ThemeProvider>
                    </OnboardingProvider>
                </PreferencesProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
