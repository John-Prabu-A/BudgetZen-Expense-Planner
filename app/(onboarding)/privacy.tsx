
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Switch, Text, TouchableOpacity, View } from 'react-native';

const PrivacyScreen = () => {
  const [sendStats, setSendStats] = useState(false);
  const router = useRouter();

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Privacy
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <Text>Send crash and usage statistics</Text>
        <Switch value={sendStats} onValueChange={setSendStats} />
      </View>
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <TouchableOpacity onPress={() => Linking.openURL('#')}>
          <Text style={{ color: 'blue', marginRight: 10 }}>Terms</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL('#')}>
          <Text style={{ color: 'blue' }}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => router.push('./tutorial')}>
        <View style={{ backgroundColor: 'blue', padding: 15, borderRadius: 5 }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Next</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default PrivacyScreen;
