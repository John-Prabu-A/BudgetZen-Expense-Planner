
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { currencies } from '../../lib/currencies';

const CurrencyScreen = () => {
  const [search, setSearch] = useState('');
  const router = useRouter();

  const filteredCurrencies = currencies.filter(
    (currency) =>
      currency.name.toLowerCase().includes(search.toLowerCase()) ||
      currency.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Select Currency
      </Text>
      <TextInput
        style={{ borderWidth: 1, padding: 10, marginBottom: 20, borderRadius: 5 }}
        placeholder="Search currency..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filteredCurrencies}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => router.push('./reminders')}>
            <View style={{ padding: 15, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
              <Text>{`${item.name} - ${item.code}`}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default CurrencyScreen;
