
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';

const RemindersScreen = () => {
  const [showReminders, setShowReminders] = useState(false);
  const router = useRouter();

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Reminders
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <Text>Show reminder notification</Text>
        <Switch value={showReminders} onValueChange={setShowReminders} />
      </View>
      <TouchableOpacity onPress={() => router.push('./privacy')}>
        <View style={{ backgroundColor: 'blue', padding: 15, borderRadius: 5 }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Next</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default RemindersScreen;
