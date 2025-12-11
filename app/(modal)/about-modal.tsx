import { useTheme } from '@/context/Theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutModal() {
  const router = useRouter();
  const { isDark, colors } = useTheme();

  const handleOpenURL = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons
            name="chevron-left"
            size={28}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          About BudgetZen
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo & Info */}
        <View style={[styles.headerSection, { backgroundColor: colors.surface }]}>
          <View
            style={[
              styles.logoBox,
              { backgroundColor: 'rgba(59, 130, 246, 0.1)' },
            ]}>
            <MaterialCommunityIcons name="wallet" size={60} color={colors.accent} />
          </View>
          <Text style={[styles.appTitle, { color: colors.text }]}>BudgetZen</Text>
          <Text style={[styles.appVersion, { color: colors.textSecondary }]}>
            Version 1.0.0
          </Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>
            Your Personal Finance Companion
          </Text>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            About
          </Text>

          <View
            style={[
              styles.descriptionBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text style={[styles.descriptionText, { color: colors.text }]}>
              BudgetZen is a powerful expense tracking and budget management app designed to help you take control of your finances. Track spending, analyze patterns, and achieve your financial goals.
            </Text>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            Key Features
          </Text>

          {[
            { icon: 'receipt', title: 'Expense Tracking', desc: 'Record and categorize your expenses' },
            { icon: 'chart-line', title: 'Analytics', desc: 'Visualize your spending patterns' },
            { icon: 'wallet', title: 'Budget Management', desc: 'Set and track your budgets' },
            { icon: 'cloud-sync-outline', title: 'Cloud Sync', desc: 'Backup and restore your data' },
          ].map((feature, idx) => (
            <View key={idx} style={[styles.featureItem, { borderBottomColor: colors.border }]}>
              <MaterialCommunityIcons
                name={feature.icon as any}
                size={24}
                color={colors.accent}
              />
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>
                  {feature.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            Contact & Support
          </Text>

          <TouchableOpacity
            style={[
              styles.contactButton,
              { borderColor: colors.border },
            ]}
            onPress={() => handleOpenURL('mailto:jpdevland@gmail.com')}>
            <View style={styles.contactContent}>
              <MaterialCommunityIcons
                name="email-outline"
                size={24}
                color={colors.accent}
              />
              <View style={styles.contactText}>
                <Text style={[styles.contactLabel, { color: colors.text }]}>
                  Email Support
                </Text>
                <Text style={[styles.contactValue, { color: colors.textSecondary }]}>
                  jpdevland@gmail.com
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.contactButton,
              { borderColor: colors.border },
            ]}
            onPress={() => handleOpenURL('https://www.jpdevland.com/app/budgetzen')}>
            <View style={styles.contactContent}>
              <MaterialCommunityIcons
                name="web"
                size={24}
                color={colors.accent}
              />
              <View style={styles.contactText}>
                <Text style={[styles.contactLabel, { color: colors.text }]}>
                  Website
                </Text>
                <Text style={[styles.contactValue, { color: colors.textSecondary }]}>
                  www.jpdevland.com/app/budgetzen
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Credits Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            Credits
          </Text>

          <View
            style={[
              styles.creditsBox,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}>
            <Text style={[styles.creditsText, { color: colors.text }]}>
              <Text style={{ fontWeight: 'bold' }}>Developed by:</Text>
              {'\n'}JP Dev Land
            </Text>
            <Text style={[styles.creditsText, { color: colors.text, marginTop: 8 }]}>
              <Text style={{ fontWeight: 'bold' }}>Built with:</Text>
              {'\n'}React Native, Expo, TypeScript
            </Text>
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            Legal
          </Text>

          <TouchableOpacity
            style={[
              styles.legalButton,
              { borderColor: colors.border },
            ]}>
            <Text style={[styles.legalText, { color: colors.text }]}>
              Privacy Policy
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.legalButton,
              { borderColor: colors.border },
            ]}>
            <Text style={[styles.legalText, { color: colors.text }]}>
              Terms of Service
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.legalButton,
              { borderColor: colors.border },
            ]}>
            <Text style={[styles.legalText, { color: colors.text }]}>
              Licenses
            </Text>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            © 2025 BudgetZen. All rights reserved.
          </Text>
        </View>
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
  },
  content: {
    flex: 1,
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 8,
  },
  logoBox: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  descriptionBox: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  descriptionText: {
    fontSize: 13,
    lineHeight: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    gap: 12,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  contactContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  contactText: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 12,
  },
  creditsBox: {
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  creditsText: {
    fontSize: 12,
    lineHeight: 18,
  },
  legalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  legalText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 11,
  },
});
