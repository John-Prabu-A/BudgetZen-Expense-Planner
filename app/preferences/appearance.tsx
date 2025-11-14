import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { usePreferences } from '@/context/Preferences';
import { useUIMode } from '@/hooks/useUIMode';
import { Picker } from '@react-native-picker/picker';

const AppearanceSettings = () => {
  const { theme, setTheme, uiMode, setUIMode } = usePreferences();
  const { fontMd, md } = useUIMode();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { fontSize: fontMd }]}>Appearance</Text>

      <View style={[styles.setting, { marginBottom: md }]}>
        <Text style={{ fontSize: fontMd }}>Theme</Text>
        <Picker
          selectedValue={theme}
          onValueChange={(itemValue) => setTheme(itemValue)}
          style={{ width: 150 }}>
          <Picker.Item label="Light" value="light" />
          <Picker.Item label="Dark" value="dark" />
          <Picker.Item label="System" value="system" />
        </Picker>
      </View>

      <View style={styles.setting}>
        <Text style={{ fontSize: fontMd }}>UI Mode</Text>
        <Picker
          selectedValue={uiMode}
          onValueChange={(itemValue) => setUIMode(itemValue)}
          style={{ width: 150 }}>
          <Picker.Item label="Compact" value="compact" />
          <Picker.Item label="Standard" value="standard" />
          <Picker.Item label="Spacious" value="spacious" />
        </Picker>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

export default AppearanceSettings;
