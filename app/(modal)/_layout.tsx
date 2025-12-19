import { useTheme } from '@/context/Theme';
import { Stack } from 'expo-router';

export default function ModalLayout() {
    const { colors } = useTheme();

    return (
        <Stack
            screenOptions={{
                contentStyle: {
                    backgroundColor: colors.background,
                },
                headerShown: false,
            }}
        >
            <Stack.Screen name="add-record-modal" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="add-budget-modal" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="add-account-modal" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="add-category-modal" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="edit-category-modal" options={{ presentation: 'modal', headerShown: false }} />
            <Stack.Screen name="export-records-modal" options={{ headerShown: false }} />
            <Stack.Screen name="backup-restore-modal" options={{ headerShown: false }} />
            <Stack.Screen name="delete-reset-modal" options={{ headerShown: false }} />
            <Stack.Screen name="security-modal" options={{ headerShown: false }} />
            <Stack.Screen name="notifications-modal" options={{ headerShown: false }} />
            <Stack.Screen name="advanced-modal" options={{ headerShown: false }} />
            <Stack.Screen name="data-management-modal" options={{ headerShown: false }} />
            <Stack.Screen name="about-modal" options={{ headerShown: false }} />
            <Stack.Screen name="legal-viewer-modal" options={{ headerShown: false }} />
            <Stack.Screen name="help-modal" options={{ headerShown: false }} />
            <Stack.Screen name="feedback-modal" options={{ headerShown: false }} />
        </Stack>
    );
}
