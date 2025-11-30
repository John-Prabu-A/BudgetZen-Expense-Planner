
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/Auth';
import { OnboardingProvider, OnboardingStep, useOnboarding } from '../context/Onboarding';
import { PreferencesProvider, usePreferences } from '../context/Preferences';
import { ThemeProvider, useTheme } from '../context/Theme';

const InitialLayout = () => {
    const { session, loading: authLoading } = useAuth();
    const { isDark, colors } = useTheme();
    const { passcodeEnabled } = usePreferences();
    const { currentStep, loading: onboardingLoading } = useOnboarding();
    const router = useRouter();
    const segments = useSegments();
    const navigationReady = useRootNavigationState()?.key;
    const [passwordChecked, setPasswordChecked] = useState(false);

    // Determine if we need to show password screen
    useEffect(() => {
        // Password check should happen once per app launch
        if (authLoading || onboardingLoading || !navigationReady) {
            return;
        }

        // Check if user is logged in and passcode is enabled
        // If so, they need to verify password before accessing app
        if (session && passcodeEnabled && !passwordChecked) {
            console.log('User logged in with passcode enabled, showing password verification');
            // Navigate to passcode verification screen
            // This will be shown before accessing main app
            setPasswordChecked(true);
            return;
        }

        if (session) {
            setPasswordChecked(true);
        }
    }, [session, passcodeEnabled, navigationReady, authLoading, onboardingLoading]);

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

        if (session && !passwordChecked) {
            console.log('Password not yet checked');
            return;
        }

        const inAuthGroup = segments[0] === '(auth)';
        const inOnboardingGroup = segments[0] === '(onboarding)';
        const inTabsGroup = segments[0] === '(tabs)';
        const isModal = segments[0] === '(modal)';

        console.log('Navigation logic:', {
            hasSession: !!session,
            passwordChecked,
            onboardingStep: currentStep,
            isOnboardingComplete: currentStep === OnboardingStep.COMPLETED,
            inAuthGroup,
            inOnboardingGroup,
            inTabsGroup,
            isModal,
            segments,
        });

        // If in modal, don't change navigation
        if (isModal) {
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
        passwordChecked,
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

    return (
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
    );
};

export default function RootLayout() {
    return (
        <AuthProvider>
            <PreferencesProvider>
                <OnboardingProvider>
                    <ThemeProvider>
                        <InitialLayout />
                    </ThemeProvider>
                </OnboardingProvider>
            </PreferencesProvider>
        </AuthProvider>
    );
}
