/**
 * Legal Viewer Modal
 * Displays legal documents with support for:
 * - In-app WebView content (Privacy Policy, Terms of Service)
 * - Bundled static content (Licenses)
 * - Loading states and error handling
 * - Safe area support
 * - Theme integration
 */

import { useTheme } from '@/context/Theme';
import { LEGAL_URLS, LegalDocumentType } from '@/lib/config/legalUrls';
import { isValidLegalUrl, openLegalDocument } from '@/lib/legal/legalBrowser';
import { LICENSES_BUNDLE } from '@/lib/legal/licenseContent';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LegalViewerModal() {
  const router = useRouter();
  const { isDark, colors } = useTheme();
  const { documentType } = useLocalSearchParams<{ documentType: string }>();

  // Validate and get document type
  const validDocumentType = useMemo<LegalDocumentType>(() => {
    const valid = ['privacyPolicy', 'termsOfService', 'licenses'];
    return valid.includes(documentType ?? '') ? (documentType as LegalDocumentType) : 'privacyPolicy';
  }, [documentType]);

  // Get document title and URL
  const document = useMemo(() => {
    const titles: Record<LegalDocumentType, string> = {
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      licenses: 'Open Source Licenses',
    };
    
    return {
      title: titles[validDocumentType],
      url: LEGAL_URLS[validDocumentType],
    };
  }, [validDocumentType]);

  /**
   * Handle opening the legal document
   * For licenses: show bundled content
   * For policy/terms: open in native WebView
   */
  const handleOpenDocument = async () => {
    try {
      if (validDocumentType === 'licenses') {
        // Licenses are bundled content - show in modal
        console.log('[LegalViewer] Licenses opened (already displaying bundled content)');
        return;
      }

      // Validate URL before opening
      if (!isValidLegalUrl(document.url)) {
        console.error('[LegalViewer] Invalid legal URL:', document.url);
        return;
      }

      // Open in native WebView
      await openLegalDocument(document.url, document.title);
    } catch (error) {
      console.error('[LegalViewer] Error opening document:', error);
    }
  };

  /**
   * Render bundled license content
   */
  const renderLicenseContent = () => {
    const lines = LICENSES_BUNDLE.split('\n');
    
    return (
      <View style={styles.contentSection}>
        {lines.map((line, index) => {
          // Headings
          if (line.startsWith('# ')) {
            return (
              <Text
                key={index}
                style={[
                  styles.heading1,
                  { color: colors.text },
                ]}>
                {line.replace('# ', '')}
              </Text>
            );
          }
          
          // Sub-headings
          if (line.startsWith('## ')) {
            return (
              <Text
                key={index}
                style={[
                  styles.heading2,
                  { color: colors.accent },
                ]}>
                {line.replace('## ', '')}
              </Text>
            );
          }

          // Divider
          if (line === '---') {
            return (
              <View
                key={index}
                style={[
                  styles.divider,
                  { backgroundColor: colors.border },
                ]}
              />
            );
          }

          // Regular text
          if (line.trim()) {
            return (
              <Text
                key={index}
                style={[
                  styles.bodyText,
                  { color: colors.text },
                ]}>
                {line}
              </Text>
            );
          }

          // Empty lines for spacing
          return <View key={index} style={styles.spacer} />;
        })}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            accessibilityLabel="Go back">
            <MaterialCommunityIcons
              name="chevron-left"
              size={28}
              color={colors.text}
            />
          </TouchableOpacity>

          <Text
            style={[styles.headerTitle, { color: colors.text }]}
            numberOfLines={1}>
            {document.title}
          </Text>

          <View style={{ width: 28 }} />
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}>
          {validDocumentType === 'licenses' ? (
            renderLicenseContent()
          ) : (
            // For Privacy Policy and Terms of Service
            // Show placeholder with action button
            <View style={styles.contentSection}>
              <View
                style={[
                  styles.placeholderBox,
                  { backgroundColor: colors.surface },
                ]}>
                <MaterialCommunityIcons
                  name={validDocumentType === 'privacyPolicy' ? 'shield-account-outline' : 'file-document-outline'}
                  size={48}
                  color={colors.accent}
                />

                <Text
                  style={[
                    styles.placeholderTitle,
                    { color: colors.text },
                  ]}>
                  {document.title}
                </Text>

                <Text
                  style={[
                    styles.placeholderDescription,
                    { color: colors.textSecondary },
                  ]}>
                  This document will open in your browser
                </Text>

                <TouchableOpacity
                  style={[
                    styles.openButton,
                    { backgroundColor: colors.accent },
                  ]}
                  onPress={handleOpenDocument}
                  accessibilityLabel={`Open ${document.title} in browser`}>
                  <MaterialCommunityIcons
                    name="open-in-new"
                    size={20}
                    color="#ffffff"
                  />
                  <Text style={styles.openButtonText}>
                    Open in Browser
                  </Text>
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.infoBox,
                  { backgroundColor: colors.surface },
                ]}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text
                  style={[
                    styles.infoText,
                    { color: colors.textSecondary },
                  ]}>
                  This document is hosted online. Make sure you have an internet connection to view the full content.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
  },
  contentSection: {
    paddingHorizontal: 16,
  },
  
  // License content styles
  heading1: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 16,
  },
  heading2: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  spacer: {
    height: 8,
  },

  // Placeholder styles (for Privacy Policy, Terms of Service)
  placeholderBox: {
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderDescription: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  openButton: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    gap: 8,
  },
  openButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },

  // Info box
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
});
