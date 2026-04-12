import UnifiedLockScreen from '@/components/UnifiedLockScreen';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
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
    // Disable console logs in production for better performance and privacy
    if (!__DEV__) {
        console.log = () => {};
        console.info = () => {};
        console.debug = () => {};
        // Keep console.warn and console.error for monitoring
    }

    const { session, loading: authLoading, isPasswordLocked, unlockPassword, passwordStatusChecked } = useAuth();
    const { isDark, colors } = useTheme();
    const { authMethod, passwordHash, passcodeHash, passcodeLength } = usePreferences();
    const { currentStep, loading: onboardingLoading } = useOnboarding();
    const router = useRouter();
    const segments = useSegments();
    const navigationReady = useRootNavigationState()?.key;
    // Notifications context (available because this component is rendered inside NotificationsProvider)
    const { registerPushToken, syncTokenWithBackend, loadPreferences: loadNotificationPreferences } = useNotifications();
    
    // Track last navigation action to prevent rapid repeated navigations
    const lastNavigationRef = useRef<{ route: string; timestamp: number } | null>(null);
    
    // Track if password was just unlocked to prevent immediate re-navigation
    const justUnlockedRef = useRef(false);

    // Track when password is unlocked to skip navigation logic briefly
    useEffect(() => {
        if (!isPasswordLocked && justUnlockedRef.current === false) {
            console.log('[NAV-DEBUG] Password was just unlocked - setting justUnlockedRef to true');
            justUnlockedRef.current = true;
            
            // Reset the flag after a brief moment to allow navigation to complete
            const timer = setTimeout(() => {
                console.log('[NAV-DEBUG] Resetting justUnlockedRef to false');
                justUnlockedRef.current = false;
            }, 500);
            
            return () => clearTimeout(timer);
        }
    }, [isPasswordLocked]);

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
        console.log('[NAV-DEBUG] ====== NAVIGATION EFFECT TRIGGERED ======');
        console.log('[NAV-DEBUG] Effect dependencies:', {
            navigationReady,
            authLoading,
            onboardingLoading,
            currentStep,
            isPasswordLocked,
            passwordStatusChecked,
            segments: segments?.[0],
            justUnlocked: justUnlockedRef.current,
        });

        if (!navigationReady) {
            console.log('[NAV] Navigation not ready');
            return;
        }

        if (authLoading || onboardingLoading) {
            console.log('[NAV] Still loading auth or onboarding');
            return;
        }

        // CRITICAL: Wait for password status to be checked before proceeding
        if (!passwordStatusChecked) {
            console.log('[NAV-DEBUG] ⏳ PASSWORD STATUS NOT YET CHECKED - waiting...');
            return;
        }

        // If password was just unlocked, skip navigation logic briefly
        // This gives Expo Router time to complete the previous navigation
        if (justUnlockedRef.current) {
            console.log('[NAV-DEBUG] ⏰ PASSWORD JUST UNLOCKED - skipping navigation logic for 500ms');
            return;
        }

        if (currentStep === null) {
            console.log('[NAV] Onboarding step not loaded yet');
            return;
        }

        // If password is locked, don't proceed with navigation
        // Reset the navigation ref so it doesn't try to re-navigate
        if (isPasswordLocked) {
            console.log('[NAV-DEBUG] 🔒 PASSWORD IS LOCKED');
            console.log('[NAV] ⏸️  Password is locked - showing lock screen, skipping navigation');
            lastNavigationRef.current = null; // Clear ref so we don't have stale navigation attempts
            return;
        }

        const inAuthGroup = segments?.[0] === '(auth)';
        const inOnboardingGroup = segments?.[0] === '(onboarding)';
        const inTabsGroup = segments?.[0] === '(tabs)';
        const inPreferences = segments?.[0] === 'preferences';
        const isModal = segments?.[0] === '(modal)';
        const inAppGroup = segments?.[0] === '(app)';

        console.log('[NAV-DEBUG] Route detection:', {
            inAuthGroup,
            inOnboardingGroup,
            inTabsGroup,
            inAppGroup,
            inPreferences,
            isModal,
            currentSegment: segments?.[0],
        });

        // If segments don't have a group, navigation hasn't been initialized yet
        // This is normal when the app is first loading - just wait
        // if (!inAuthGroup && !inOnboardingGroup && !inTabsGroup && !inPreferences && !isModal && !inAppGroup) {
        //     console.log('[NAV] ⏳ Waiting for route initialization (segments not yet populated)');
        //     console.log('[NAV-DEBUG] ⏳ Segments is empty or invalid:', segments);
        //     return;
        // }

        console.log('[NAV] Current route state:', {
            segments: segments[0],
            hasSession: !!session,
            onboardingStep: currentStep,
            inAuthGroup,
            inOnboardingGroup,
            inTabsGroup,
            inAppGroup,
        });

        // If in modal or preferences, don't change navigation
        if (isModal || inPreferences) {
            console.log('[NAV] 📍 In modal/preferences, skip navigation');
            return;
        }

        // If in (app) group - this is a valid sub-route, don't interfere
        if (inAppGroup) {
            console.log('[NAV] 📍 In (app) group, skip navigation interference');
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

            // Only navigate if not already in onboarding group
            if (!inOnboardingGroup) {
                // Prevent rapid repeated navigation to same route
                const now = Date.now();
                if (!lastNavigationRef.current || lastNavigationRef.current.route !== targetRoute || now - lastNavigationRef.current.timestamp > 1000) {
                    console.log(`[NAV] 🎓 Onboarding not complete (${currentStep}) → ${targetRoute}`);
                    console.log('[NAV-DEBUG] Executing navigation to onboarding...');
                    router.replace(targetRoute as any);
                    lastNavigationRef.current = { route: targetRoute, timestamp: now };
                }
            } else {
                console.log(`[NAV] ✅ Already on onboarding screen`);
            }
            return;
        }

        // PRIORITY 2: Onboarding IS complete, check session
        // NO SESSION: User not logged in, show login/signup
        if (!session) {
            if (!inAuthGroup) {
                const targetRoute = '/(auth)/login';
                const now = Date.now();
                // Prevent rapid repeated navigation
                if (!lastNavigationRef.current || lastNavigationRef.current.route !== targetRoute || now - lastNavigationRef.current.timestamp > 1000) {
                    console.log('[NAV] 🔐 Onboarding done, no session → login');
                    console.log('[NAV-DEBUG] Executing navigation to login...');
                    router.replace(targetRoute as any);
                    lastNavigationRef.current = { route: targetRoute, timestamp: now };
                }
            } else {
                console.log('[NAV] ✅ Already on auth screen');
            }
            return;
        }

        // PRIORITY 3: Onboarding complete AND user is logged in → Show main app
        // Accept both (tabs) and (app) as valid main app groups
        if (inAuthGroup) {
            // User is in auth group but has a valid session
            // They've completed auth, so navigate them to the main app
            // Use router.dismiss() to close the auth stack, then navigate to tabs
            const targetRoute = '/(tabs)';
            const now = Date.now();
            if (!lastNavigationRef.current || lastNavigationRef.current.route !== targetRoute || now - lastNavigationRef.current.timestamp > 1000) {
                console.log('[NAV] ✅ Session active & onboarding complete → navigating out of auth to main app');
                console.log('[NAV-DEBUG] Navigating with route:', targetRoute);
                try {
                    // Use the native module to ensure proper navigation
                    router.replace(targetRoute as any);
                    lastNavigationRef.current = { route: targetRoute, timestamp: now };
                    console.log('[NAV-DEBUG] Navigation executed successfully');
                } catch (error) {
                    console.error('[NAV-ERROR] Navigation failed:', error);
                }
            }
            return;
        }

        if (!inTabsGroup && !inAppGroup && !inOnboardingGroup && !inAuthGroup && segments?.length > 0) {
            const targetRoute = '/(tabs)';
            const now = Date.now();
            // Prevent rapid repeated navigation
            if (!lastNavigationRef.current || lastNavigationRef.current.route !== targetRoute || now - lastNavigationRef.current.timestamp > 1000) {
                console.log('[NAV] 🏠 Session active, onboarding done → main app');
                console.log('[NAV-DEBUG] Navigating with route:', targetRoute);
                try {
                    router.replace(targetRoute as any);
                    lastNavigationRef.current = { route: targetRoute, timestamp: now };
                    console.log('[NAV-DEBUG] Navigation executed successfully');
                } catch (error) {
                    console.error('[NAV-ERROR] Navigation failed:', error);
                }
            }
        } else {
            console.log('[NAV] ✅ Already on expected screen or segments not ready');
        }
    }, [
        session,
        router,
        navigationReady,
        authLoading,
        onboardingLoading,
        currentStep,
        isPasswordLocked,
        passwordStatusChecked,
        segments,
    ]);

    // Show loading state while initializing
    // BUT: if onboarding is complete and we have a session, don't show loading
    // This prevents the spinner from appearing after tutorial completes
    const shouldShowLoading = (authLoading || onboardingLoading || currentStep === null || !navigationReady || !passwordStatusChecked) &&
        !(currentStep === OnboardingStep.COMPLETED && session);
    
    if (shouldShowLoading) {
        console.log('[DEBUG] 🔄 Loading state - showing spinner:', {
            authLoading,
            onboardingLoading,
            currentStep,
            navigationReady,
            passwordStatusChecked,
        });
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.accent} />
            </View>
        );
    }

    // Show password lock screen if password is locked
    // Show the appropriate lock screen based on authMethod and available credentials
    let lockScreenElement = null;
    if (isPasswordLocked) {
        console.log('[DEBUG] 🔒 PASSWORD LOCK SCREEN - Rendering lock screen:', {
            isPasswordLocked,
            hasPasswordHash: !!passwordHash,
            hasPasscodeHash: !!passcodeHash,
            authMethod,
            passcodeLength,
        });

        // If we have password hash, show password lock screen (fallback/default)
        if (passwordHash) {
            console.log('[DEBUG] 🔐 Rendering PASSWORD lock screen');
            lockScreenElement = (
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
            console.log('[DEBUG] 📱 Rendering PASSCODE lock screen');
            lockScreenElement = (
                <UnifiedLockScreen
                    authMethod="passcode"
                    passcodeHash={passcodeHash}
                    passcodeLength={passcodeLength}
                    onUnlock={unlockPassword}
                />
            );
        } else {
            // If neither password nor passcode, something is wrong
            console.warn('[DEBUG] ⚠️ PASSWORD LOCKED BUT NO CREDENTIALS FOUND!', {
                isPasswordLocked,
                hasPasswordHash: !!passwordHash,
                hasPasscodeHash: !!passcodeHash,
            });
        }
    }

    console.log('[DEBUG] 🗺️ RENDERING STACK with all routes registered:', {
        isPasswordLocked,
        authLoading,
        onboardingLoading,
        navigationReady,
    });

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
                <Stack.Screen name="(app)" options={{ headerShown: false }} />
                <Stack.Screen name="(modal)" options={{ headerShown: false }} />
                <Stack.Screen name="preferences" options={{ headerShown: false }} />
                <Stack.Screen name="passcode-setup" options={{ headerShown: false }} />
            </Stack>
            {lockScreenElement && (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background, zIndex: 9999 }]}>
                    {lockScreenElement}
                </View>
            )}
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
