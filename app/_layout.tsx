
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuth } from '../context/Auth';

const InitialLayout = () => {
    const { session, loading } = useAuth();
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
        <Stack>
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="add-record-modal" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="add-budget-modal" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="add-account-modal" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="add-category-modal" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
    );
};

export default function RootLayout() {
    return (
        <AuthProvider>
            <InitialLayout />
        </AuthProvider>
    );
}
