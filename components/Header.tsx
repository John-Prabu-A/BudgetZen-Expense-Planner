import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { useUIMode } from '@/hooks/useUIMode';

const Header = () => {
  const { lg, md } = useUIMode();
  const colorScheme = useColorScheme();
  const colors = {
    light: {
      background: '#FFFFFF',
      text: '#000000',
      subText: '#6c757d',
    },
    dark: {
      background: '#1A1A1A',
      text: '#FFFFFF',
      subText: '#adb5bd',
    },
  };
  const selectedColors = colors[colorScheme || 'light'];

  return (
    <View style={[styles.headerContainer, { backgroundColor: selectedColors.background, paddingVertical: lg, paddingHorizontal: md }]}>
      <Text style={[styles.appName, { color: selectedColors.text }]}>
        BudgetZen
      </Text>
      <Text style={[styles.subTitle, { color: selectedColors.subText }]}>
        Expense Planner
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'YourStylishFont', // Replace with a stylish font
  },
  subTitle: {
    fontSize: 16,
    fontFamily: 'YourSuitableFont', // Replace with a suitable font
  },
});

export default Header;
