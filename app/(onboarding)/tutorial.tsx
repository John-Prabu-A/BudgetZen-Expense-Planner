
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Alert, Dimensions, FlatList, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const slides = [
  { key: '1', title: 'Categories', text: 'Create categories to organize your spending.' },
  { key: '2', title: 'Accounts', text: 'Add your accounts to track your balances.' },
  { key: '3', title: 'Records', text: 'Record your transactions to see where your money goes.' },
];

const TutorialScreen = () => {
  const router = useRouter();

  const handleComplete = async () => {
    try {
      console.log('Saving onboarding complete status...');
      // Save onboarding completion status
      await SecureStore.setItemAsync('onboarding_complete', 'true');
      
      // Verify it was saved
      const saved = await SecureStore.getItemAsync('onboarding_complete');
      console.log('Verified saved status:', saved);
      
      // Navigate to main app
      console.log('Navigating to tabs...');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  const renderItem = ({ item, index }: {item: any, index: number}) => (
    <View style={{ width, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>{item.title}</Text>
      <Text style={{ textAlign: 'center', marginBottom: 40 }}>{item.text}</Text>
      {index === slides.length - 1 && (
        <TouchableOpacity onPress={handleComplete}>
          <View style={{ backgroundColor: '#0284c7', padding: 15, borderRadius: 5 }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Get Started</Text>
          </View>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <FlatList
      data={slides}
      renderItem={renderItem}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item) => item.key}
    />
  );
};

export default TutorialScreen;
