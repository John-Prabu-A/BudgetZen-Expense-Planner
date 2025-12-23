import UnifiedLockScreen from '@/components/UnifiedLockScreen';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/Auth';
import { NotificationsProvider, useNotifications } from '../context/Notifications';
import { OnboardingProvider, OnboardingStep, useOnboarding } from '../context/Onboarding';
import { PreferencesProvider, usePreferences } from '../context/Preferences';
import { ThemeProvider, useTheme } from '../context/Theme';
import { ToastProvider } from '../context/Toast';
import { IngestionProvider } from '../context/TransactionIngestion';
import { setupDeepLinking } from '../lib/deepLinking';
import { JobScheduler } from '../lib/notifications/jobScheduler';
import { setupNotificationCategories } from '../lib/notifications/notificationCategories';
import { setupNotificationChannels } from '../lib/notifications/notificationChannels';
import { notificationQueueManager } from '../lib/notifications/notificationQueue';
import { NotificationService } from '../lib/notifications/NotificationService';
import { supabase } from '../lib/supabase';

const InitialLayout = () => {
    const { session, loading: authLoading, isPasswordLocked, unlockPassword } = useAuth();
    const { isDark, colors } = useTheme();
    const { authMethod, passwordHash, passcodeHash, passcodeLength } = usePreferences();
    const { currentStep, loading: onboardingLoading } = useOnboarding();
    const router = useRouter();
    const segments = useSegments();
    const navigationReady = useRootNavigationState()?.key;
    // Notifications context (available because this component is rendered inside NotificationsProvider)
    const { registerPushToken, syncTokenWithBackend, loadPreferences: loadNotificationPreferences } = useNotifications();

    // Initialize notifications and transaction ingestion on app startup
    useEffect(() => {
        const initializeServices = async () => {
            try {
                // Setup Android notification channels
                await setupNotificationChannels();
                
                // Setup iOS notification categories
                await setupNotificationCategories();
                
                // Setup deep linking
                setupDeepLinking();
                
                // Start job scheduler for daily/weekly batch notifications
                const scheduler = JobScheduler.getInstance();
                await scheduler.start();
                
                console.log('✅ Notifications initialized');
                console.log('✅ Transaction ingestion context ready');
            } catch (error) {
                console.error('❌ Error initializing services:', error);
            }
        };

        initializeServices();

        // Cleanup on unmount
        return () => {
            const scheduler = JobScheduler.getInstance();
            scheduler.stop().catch((error: any) => {
                console.warn('Error stopping scheduler:', error);
            });
        };
    }, []);

    // When a user session is available, register the device for push, sync token with backend and load user notification prefs
    useEffect(() => {
        let mounted = true;
        if (!session?.user?.id) return;

        (async () => {
            try {
                console.log('[NOTIF] Initializing user notification state...');

                // Request permission and register device (this handles permission prompts)
                const registered = await registerPushToken();
                console.log('[NOTIF] registerPushToken ->', registered);

                // If registration succeeded, sync to backend
                if (registered === true) {
                    try {
                        const synced = await syncTokenWithBackend(session.user.id);
                        console.log('[NOTIF] syncTokenWithBackend ->', synced);
                    } catch (syncErr) {
                        console.warn('[NOTIF] Token sync failed', syncErr);
                    }
                } else {
                    // Known failure cases (improve debugging):
                    // - FCM_NOT_INITIALIZED -> missing google-services.json / FCM setup
                    // - UNSUPPORTED_ENV_EXPO_GO_ANDROID -> running in Expo Go on Android
                    console.warn('[NOTIF] Skipping backend sync because registerPushToken returned false or an unsupported environment.');
                }

                // Load user preferences (scheduling or enabling behavior can depend on these)
                try {
                    await loadNotificationPreferences(session.user.id);
                    console.log('[NOTIF] Loaded notification preferences for user');
                } catch (prefsErr) {
                    console.warn('[NOTIF] Loading notification preferences failed', prefsErr);
                }

                // 🔄 PHASE 3.2: Process queue periodically (every 5 minutes)
                if (mounted) {
                    const queueProcessingInterval = setInterval(() => {
                        notificationQueueManager.sendPending(session.user.id)
                            .then((result) => {
                                if (result.sent > 0 || result.failed > 0) {
                                    console.log(`[NOTIF] Queue processed: ${result.sent} sent, ${result.failed} failed`);
                                }
                            })
                            .catch((err) => {
                                console.warn('[NOTIF] Error processing queue:', err);
                            });
                    }, 5 * 60 * 1000); // Every 5 minutes

                    // Also process on app startup
                    notificationQueueManager.sendPending(session.user.id)
                        .catch((err) => {
                            console.warn('[NOTIF] Error processing queue on startup:', err);
                        });

                    // Cleanup interval
                    return () => clearInterval(queueProcessingInterval);
                }

            } catch (err) {
                console.error('[NOTIF] Error initializing notifications for user:', err);
            }
        })();

        return () => {
            mounted = false;
        };
    }, [
        session,
        registerPushToken,
        syncTokenWithBackend,
        loadNotificationPreferences,
    ]);

    // 🔄 PHASE 3.3: Subscribe to real-time queue updates
    useEffect(() => {
        let mounted = true;
        if (!session?.user?.id) return;

        const userId = session.user.id;
        const notificationService = NotificationService.getInstance();

        // Subscribe to real-time queue updates using Realtime
        const channel = supabase
            .channel(`notification_queue:user_id=eq.${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notification_queue',
                    filter: `user_id=eq.${userId}`,
                },
                (payload: any) => {
                    if (!mounted) return;

                    const notification = payload.new as any;
                    
                    if (notification.status === 'pending' || notification.status === 'sent') {
                        console.log(`[NOTIF] 🔔 New notification from queue: ${notification.title}`);

                        // Show local notification immediately if app is in foreground
                        notificationService.sendNotification({
                            type: notification.notification_type,
                            title: notification.title,
                            body: notification.body,
                            data: notification.data || {},
                        }).catch((err: any) => {
                            console.warn('[NOTIF] Error showing notification:', err);
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            mounted = false;
            supabase.removeChannel(channel);
        };
    }, [session?.user?.id]);

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

        // PRIORITY 1: Check if onboarding is complete (for all users)
        // If NOT complete, show onboarding screens FIRST (before auth or tabs)
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

        // PRIORITY 2: Onboarding IS complete, check session
        // NO SESSION: User not logged in, show login/signup
        if (!session) {
            if (!inAuthGroup) {
                console.log('[NAV] Onboarding complete, no session → Redirecting to login');
                router.replace('/(auth)/login');
            }
            return;
        }

        // PRIORITY 3: Onboarding complete AND user is logged in → Show main app
        if (!inTabsGroup) {
            console.log('[NAV] Onboarding complete + logged in → Redirecting to main app');
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
                                <NotificationsProvider>
                                    <IngestionProvider>
                                        <InitialLayout />
                                    </IngestionProvider>
                                </NotificationsProvider>
                            </ToastProvider>
                        </ThemeProvider>
                    </OnboardingProvider>
                </PreferencesProvider>
            </AuthProvider>
        </SafeAreaProvider>
    );
}
