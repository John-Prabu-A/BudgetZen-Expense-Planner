
import { useRouter } from 'expo-router';
import { Dimensions, FlatList, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

const slides = [
  { key: '1', title: 'Categories', text: 'Create categories to organize your spending.' },
  { key: '2', title: 'Accounts', text: 'Add your accounts to track your balances.' },
  { key: '3', title: 'Records', text: 'Record your transactions to see where your money goes.' },
];

const TutorialScreen = () => {
  const router = useRouter();

  const renderItem = ({ item, index }) => (
    <View style={{ width, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>{item.title}</Text>
      <Text style={{ textAlign: 'center', marginBottom: 40 }}>{item.text}</Text>
      {index === slides.length - 1 && (
        <TouchableOpacity onPress={() => router.replace('/(tabs)/')}>
          <View style={{ backgroundColor: 'blue', padding: 15, borderRadius: 5 }}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>OK</Text>
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
