/**
 * Legal Content Browser
 * 
 * Handles opening legal documents (Privacy Policy, Terms of Service) with:
 * - Native WebView experience via expo-web-browser
 * - Fallback to system browser on WebView failure
 * - Loading states and error handling
 * - Safe area support for iOS notch
 * - Accessibility support
 */

import * as WebBrowser from 'expo-web-browser';
import { Alert, Linking } from 'react-native';

/**
 * Open a legal document using native WebView
 * Falls back to system browser if WebView unavailable
 * 
 * @param url - URL of the legal document
 * @param title - Title for the WebView header
 * @returns Promise that resolves when browser is closed
 */
export const openLegalDocument = async (
  url: string,
  title: string
): Promise<void> => {
  try {
    console.log(`[Legal] Opening ${title}: ${url}`);

    // Use expo-web-browser for native WebView experience
    // This provides:
    // - Native header with back button
    // - Share, refresh, and other native controls
    // - Safe area handling on iOS (notch support)
    // - Hardware back button on Android
    const result = await WebBrowser.openBrowserAsync(url, {
      toolbarColor: '#2563eb',
      secondaryToolbarColor: '#1e40af',
    });

    console.log(`[Legal] WebBrowser result:`, result.type);

    if (result.type === 'cancel') {
      console.log(`[Legal] User closed ${title}`);
    } else if (result.type === 'dismiss') {
      console.log(`[Legal] User dismissed ${title}`);
    }
  } catch (error) {
    console.error(`[Legal] Error opening ${title}:`, error);

    // Fallback: Use system browser if WebView fails
    console.log(`[Legal] Falling back to Linking.openURL for ${title}`);
    
    try {
      await Linking.openURL(url);
      console.log(`[Legal] Successfully opened ${title} in system browser`);
    } catch (linkError) {
      console.error(`[Legal] Failed to open URL with Linking:`, linkError);
      
      // User-facing error message
      Alert.alert(
        'Unable to Open Document',
        `Could not open "${title}". Please check your internet connection and try again.`,
        [
          {
            text: 'Cancel',
            onPress: () => {},
            style: 'cancel',
          },
          {
            text: 'Retry',
            onPress: () => openLegalDocument(url, title),
          },
        ]
      );
    }
  }
};

/**
 * Validate URL before opening
 * Prevents loading untrusted or malformed URLs
 * 
 * @param url - URL to validate
 * @returns true if URL is valid and safe
 */
export const isValidLegalUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    
    // Only allow HTTPS for security
    if (parsed.protocol !== 'https:') {
      console.warn(`[Legal] Rejecting non-HTTPS URL: ${url}`);
      return false;
    }
    
    // Only allow jpdevland.com domain
    if (!parsed.hostname.endsWith('jpdevland.com')) {
      console.warn(`[Legal] Rejecting URL from untrusted domain: ${url}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`[Legal] Invalid URL format: ${url}`);
    return false;
  }
};
