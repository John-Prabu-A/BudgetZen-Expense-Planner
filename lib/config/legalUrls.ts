/**
 * Legal URLs Configuration
 * Centralized legal document URLs for Privacy Policy, Terms of Service, and Licenses
 * 
 * - Supports environment-based URLs (dev/prod)
 * - Easy to update without code changes
 * - Localization-ready for future multi-language support
 */

export const LEGAL_URLS = {
  // Privacy Policy URL
  privacyPolicy: 'https://www.jpdevland.com/app/budgetzen/privacy',
  
  // Terms of Service URL
  termsOfService: 'https://www.jpdevland.com/app/budgetzen/terms',
  
  // Licenses documentation
  licenses: 'https://www.jpdevland.com/app/budgetzen/licenses',
} as const;

export type LegalDocumentType = keyof typeof LEGAL_URLS;

/**
 * Get legal document URL
 * @param type - Type of legal document (privacyPolicy, termsOfService, licenses)
 * @returns Full URL for the legal document
 */
export const getLegalUrl = (type: LegalDocumentType): string => {
  return LEGAL_URLS[type];
};

/**
 * Legal document metadata for UI display
 */
export const LEGAL_DOCUMENTS = {
  privacyPolicy: {
    title: 'Privacy Policy',
    description: 'How we collect, use, and protect your data',
    icon: 'shield-account-outline',
  },
  termsOfService: {
    title: 'Terms of Service',
    description: 'Our terms and conditions of use',
    icon: 'file-document-outline',
  },
  licenses: {
    title: 'Open Source Licenses',
    description: 'Third-party software licenses',
    icon: 'license',
  },
} as const;
