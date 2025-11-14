
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/Auth';
import { PreferencesProvider } from '../context/Preferences';
import { useAppColorScheme } from '../hooks/useAppColorScheme';

const InitialLayout = () => {
    const { session, loading } = useAuth();
    const colorScheme = useAppColorScheme();
    const router = useRouter();
    const segments = useSegments();
    const navigationReady = useRootNavigationState()?.key;
    const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

    // Check if onboarding is complete on mount
    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const completed = await SecureStore.getItemAsync('onboarding_complete');
                console.log('Onboarding status from storage:', completed);
                setOnboardingComplete(completed === 'true');
            } catch (error) {
                console.error('Error reading onboarding status:', error);
                setOnboardingComplete(false);
            }
        };

        checkOnboarding();
    }, []);

    useEffect(() => {
        if (!navigationReady) return;
        if (loading) return;
        if (onboardingComplete === null) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inOnboardingGroup = segments[0] === '(onboarding)';
        const inTabsGroup = segments[0] === '(tabs)';
        
        // Check if we're in a modal route
        const isModalRoute = [
            'add-record-modal',
            'add-budget-modal',
            'add-account-modal',
            'add-category-modal',
            'preferences',
            'passcode-setup',
            'export-records-modal',
            'backup-restore-modal',
            'delete-reset-modal',
            'security-modal',
            'notifications-modal',
            'advanced-modal',
            'data-management-modal',
            'about-modal',
            'help-modal',
            'feedback-modal',
        ].includes(segments[0]);

        console.log('Navigation check:', {
            session: !!session,
            onboardingComplete,
            inAuthGroup,
            inOnboardingGroup,
            inTabsGroup,
            isModalRoute,
            segments,
        });

        // Skip navigation checks if we're in a modal route
        if (isModalRoute) {
            console.log('In modal route, skipping navigation validation');
            return;
        }

        // If not authenticated, go to login
        if (!session) {
            console.log('No session, redirecting to login');
            if (!inAuthGroup) {
                router.replace('/(auth)/login');
            }
        }
        // If authenticated
        else {
            console.log('Session exists, checking onboarding...');
            // If onboarding is not complete, go to onboarding
            if (!onboardingComplete && !inOnboardingGroup) {
                console.log('Onboarding not complete, redirecting to currency');
                router.replace('/(onboarding)/currency');
            }
            // If onboarding is complete, go to main app (tabs)
            else if (onboardingComplete && !inTabsGroup) {
                console.log('Onboarding complete, redirecting to tabs');
                router.replace('/(tabs)');
            }
            // Prevent going back to auth screen when logged in
            else if (inAuthGroup && onboardingComplete) {
                console.log('In auth but onboarding complete, redirecting to tabs');
                router.replace('/(tabs)');
            }
        }
    }, [session, loading, navigationReady, onboardingComplete, segments]);

    if (loading || onboardingComplete === null || !navigationReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <Stack
            screenOptions={{
                contentStyle: {
                    backgroundColor: colorScheme === 'dark' ? '#1A1A1A' : '#FFFFFF',
                },
                headerShown: false,
            }}
        >
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="add-record-modal" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="add-budget-modal" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="add-account-modal" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="add-category-modal" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="preferences" options={{ headerShown: false }} />
            <Stack.Screen name="passcode-setup" options={{ headerShown: false }} />
            <Stack.Screen name="export-records-modal" options={{ headerShown: false }} />
            <Stack.Screen name="backup-restore-modal" options={{ headerShown: false }} />
            <Stack.Screen name="delete-reset-modal" options={{ headerShown: false }} />
            <Stack.Screen name="security-modal" options={{ headerShown: false }} />
            <Stack.Screen name="notifications-modal" options={{ headerShown: false }} />
            <Stack.Screen name="advanced-modal" options={{ headerShown: false }} />
            <Stack.Screen name="data-management-modal" options={{ headerShown: false }} />
            <Stack.Screen name="about-modal" options={{ headerShown: false }} />
            <Stack.Screen name="help-modal" options={{ headerShown: false }} />
            <Stack.Screen name="feedback-modal" options={{ headerShown: false }} />
        </Stack>
    );
};

export default function RootLayout() {
    return (
        <AuthProvider>
            <PreferencesProvider>
                <InitialLayout />
            </PreferencesProvider>
        </AuthProvider>
    );
}
