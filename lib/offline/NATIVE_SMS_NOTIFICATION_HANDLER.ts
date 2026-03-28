/**
 * Android Native SMS Receiver Integration
 * Handles SMS capture even when app is closed
 * 
 * IMPORTANT: This requires native Android code setup
 * See NATIVE_SETUP.md for implementation instructions
 */

/**
 * SMS Receiver Module - To be implemented as native Android module
 * 
 * Path: android/app/src/main/java/com/budgetzen/SMSReceiver.kt
 * 
 * Required permissions in AndroidManifest.xml:
 * - android.permission.RECEIVE_SMS
 * - android.permission.READ_SMS
 * 
 * Implementation outline:
 * 
 * ```kotlin
 * package com.budgetzen
 * 
 * import android.content.BroadcastReceiver
 * import android.content.Context
 * import android.content.Intent
 * import android.provider.Telephony
 * import android.os.Build
 * 
 * class SMSReceiver : BroadcastReceiver() {
 *     override fun onReceive(context: Context?, intent: Intent?) {
 *         if (Telephony.Sms.Intents.SMS_RECEIVED_ACTION == intent?.action) {
 *             val messages = Telephony.Sms.Intents.getMessagesFromIntent(intent)
 *             
 *             for (message in messages) {
 *                 val sender = message.originatingAddress ?: "Unknown"
 *                 val body = message.messageBody ?: ""
 *                 val timestamp = message.timestampMillis
 *                 
 *                 // Send to React Native via native module
 *                 sendToReactNative(sender, body, timestamp)
 *             }
 *         }
 *     }
 *     
 *     private fun sendToReactNative(sender: String, body: String, timestamp: Long) {
 *         // Use event emitter or module callback
 *         // Implementation depends on RN architecture
 *     }
 * }
 * ```
 */

/**
 * Notification Listener Service Module - To be implemented as native Android module
 * 
 * Path: android/app/src/main/java/com/budgetzen/NotificationListenerService.kt
 * 
 * Required permissions:
 * - android.permission.BIND_NOTIFICATION_LISTENER_SERVICE
 * 
 * Implementation outline:
 * 
 * ```kotlin
 * package com.budgetzen
 * 
 * import android.service.notification.NotificationListenerService
 * import android.service.notification.StatusBarNotification
 * import android.os.Build
 * 
 * class BankNotificationListener : NotificationListenerService() {
 *     override fun onNotificationPosted(sbn: StatusBarNotification?) {
 *         sbn?.let {
 *             val packageName = it.packageName
 *             val notification = it.notification
 *             
 *             // Only capture bank app notifications
 *             if (isBankApp(packageName)) {
 *                 val title = notification.extras.getString("android.title") ?: ""
 *                 val text = notification.extras.getString("android.text") ?: ""
 *                 
 *                 sendToReactNative(packageName, title, text)
 *             }
 *         }
 *     }
 *     
 *     private fun isBankApp(packageName: String): Boolean {
 *         val bankApps = listOf(
 *             "com.sbi.mobapp",           // SBI
 *             "com.okhdfcbank",           // HDFC
 *             "com.icicibank.android",    // ICICI
 *             "com.axis.android",         // Axis
 *             "com.fbl.android.icici",   // ICICI iMobile
 *             // Add more bank apps as needed
 *         )
 *         return packageName in bankApps
 *     }
 * }
 * ```
 */

export interface NativeModuleInterface {
  /**
   * Register SMS receiver
   */
  registerSMSReceiver(): Promise<void>;

  /**
   * Unregister SMS receiver
   */
  unregisterSMSReceiver(): Promise<void>;

  /**
   * Start notification listener
   */
  startNotificationListener(): Promise<void>;

  /**
   * Stop notification listener
   */
  stopNotificationListener(): Promise<void>;

  /**
   * Check if SMS permission granted
   */
  checkSMSPermission(): Promise<boolean>;

  /**
   * Check if notification listener permission granted
   */
  checkNotificationPermission(): Promise<boolean>;

  /**
   * Request SMS permission
   */
  requestSMSPermission(): Promise<boolean>;

  /**
   * Get list of bank apps to monitor
   */
  getBankAppsToMonitor(): Promise<string[]>;

  /**
   * Add bank app to monitoring list
   */
  addBankApp(packageName: string): Promise<void>;
}

/**
 * Current Status:
 * 
 * ✅ Can process: App is in foreground
 * ✅ Can sync: App is in background (periodic, app state trigger)
 * ❌ Cannot capture: App is closed
 * 
 * To enable SMS/Notification capture when app closed:
 * 
 * 1. Implement native SMSReceiver in Android
 * 2. Implement NotificationListenerService in Android
 * 3. Store events in local database when app closed
 * 4. Process on next app launch
 * 
 * This requires:
 * - react-native-sms-receiver library OR custom native module
 * - Custom NotificationListenerService
 * - Event queue in native storage
 */
