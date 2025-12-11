/**
 * Deep Linking Handler
 * Routes notifications to the correct app screens with parameters
 */

import * as Linking from 'expo-linking';
import { router } from 'expo-router';

export interface DeepLinkConfig {
  screen: string;
  params?: Record<string, string | number | boolean>;
}

/**
 * Deep Link Manager
 */
export class DeepLinkManager {
  /**
   * Navigate to screen based on notification data
   */
  static async navigateFromNotification(data?: Record<string, string>): Promise<void> {
    if (!data || !data.screen) {
      console.log('⚠️ No screen specified in notification data');
      return;
    }

    const linkConfig = this.mapNotificationToDeepLink(data);
    this.navigateTo(linkConfig);
  }

  /**
   * Map notification data to deep link configuration
   */
  static mapNotificationToDeepLink(data: Record<string, string>): DeepLinkConfig {
    const screen = data.screen;
    const action = data.action;

    const configMap: Record<string, DeepLinkConfig> = {
      // Analysis screen
      'analysis|view_analysis': {
        screen: '(tabs)/analysis',
        params: { view: 'weekly' },
      },
      'analysis|view_details': {
        screen: '(tabs)/analysis',
        params: { view: 'detailed' },
      },
      'analysis|view_achievements': {
        screen: '(tabs)/analysis',
        params: { tab: 'achievements' },
      },

      // Records screen
      'records|add_record': {
        screen: '(tabs)/records',
        params: { action: 'add' },
      },
      'records|view_records': {
        screen: '(tabs)/records',
        params: {},
      },

      // Budgets screen
      'budgets|view_budget': {
        screen: '(tabs)/budgets',
        params: { 
          category: data.category || 'all',
          percentage: data.percentage,
        },
      },
      'budgets|manage': {
        screen: '(tabs)/budgets',
        params: { action: 'manage' },
      },

      // Accounts screen
      'accounts|view_accounts': {
        screen: '(tabs)/accounts',
        params: {},
      },
      'accounts|low_balance': {
        screen: '(tabs)/accounts',
        params: { 
          accountId: data.accountId,
          balance: data.balance,
        },
      },

      // Settings/Preferences
      'settings|notifications': {
        screen: '(app)/preferences',
        params: { tab: 'notifications' },
      },
      'settings|preferences': {
        screen: '(app)/preferences',
        params: {},
      },
    };

    const key = `${screen}|${action}`;
    return configMap[key] || { screen: screen, params: data };
  }

  /**
   * Navigate to a specific screen with parameters
   */
  static navigateTo(config: DeepLinkConfig): void {
    try {
      if (config.params) {
        const queryString = new URLSearchParams(
          Object.entries(config.params).reduce((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          }, {} as Record<string, string>)
        ).toString();
        
        const url = `${config.screen}?${queryString}`;
        router.push(url as any);
      } else {
        router.push(config.screen as any);
      }
      
      console.log(`🔗 Navigated to: ${config.screen}`);
    } catch (error) {
      console.error('❌ Error navigating from notification:', error);
    }
  }

  /**
   * Handle URL from deep link
   */
  static async handleDeepLink(url: string): Promise<void> {
    try {
      const parsed = Linking.parse(url);
      const { hostname, path } = parsed;

      console.log(`🔗 Deep link received: ${hostname}${path}`);

      // Map hostname to screen
      const screenMap: Record<string, string> = {
        'records': '(tabs)/records',
        'budgets': '(tabs)/budgets',
        'analysis': '(tabs)/analysis',
        'accounts': '(tabs)/accounts',
        'settings': '(app)/preferences',
      };

      const screen = screenMap[hostname || ''];
      if (screen) {
        this.navigateTo({
          screen,
          params: parsed.queryParams as Record<string, string>,
        });
      }
    } catch (error) {
      console.error('❌ Error handling deep link:', error);
    }
  }

  /**
   * Create a deep link URL
   */
  static createDeepLink(config: DeepLinkConfig): string {
    const baseUrl = 'mymoney://'; // From app.json scheme
    const params = new URLSearchParams(
      Object.entries(config.params || {}).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>)
    );

    return `${baseUrl}${config.screen}${params.toString() ? `?${params.toString()}` : ''}`;
  }

  /**
   * Setup deep link listener
   */
  static setupDeepLinkListener(): (() => void) {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      this.handleDeepLink(url);
    });

    // Return cleanup function
    return () => subscription.remove();
  }

  /**
   * Check initial deep link (when app is launched from notification)
   */
  static async checkInitialDeepLink(): Promise<void> {
    try {
      const url = await Linking.getInitialURL();
      if (url) {
        this.handleDeepLink(url);
      }
    } catch (error) {
      console.error('❌ Error checking initial deep link:', error);
    }
  }
}

/**
 * Hook to setup deep linking
 * Call this in root layout on app startup
 */
export function setupDeepLinking(): void {
  // Check initial deep link
  DeepLinkManager.checkInitialDeepLink();

  // Setup listener for future links
  DeepLinkManager.setupDeepLinkListener();
}
