
import { AuthProvider, useAuth } from '../context/Auth';
import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

const InitialLayout = () => {
    const { session, loading } = useAuth();
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (session && !inAuthGroup) {
            router.replace('/(app)/account');
        } else if (!session && inAuthGroup) {
            router.replace('/(auth)/login');
        }
    }, [session, loading, segments, router]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return <Slot />;
};

export default function RootLayout() {
    return (
        <AuthProvider>
            <InitialLayout />
        </AuthProvider>
    );
}
