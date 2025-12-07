import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { useToast } from '@/context/Toast';
import { createAccount } from '@/lib/finance'; // Assume this exists
import { TempStore } from '@/lib/tempStore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddAccountModal() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState('General'); // General, Bank, Cash, etc.
  const [initialBalance, setInitialBalance] = useState('');

  const handleSave = async () => {
    if (!name) return toast.error('Name is required');
    
    try {
        const newAcc = await createAccount({
            user_id: user?.id,
            name,
            type,
            initial_balance: parseFloat(initialBalance) || 0
        });

        if (newAcc?.id) {
            TempStore.setNewAccount(newAcc.id);
        }

        toast.success('Account created');
        router.back();

    } catch (e) {
        console.error(e);
        toast.error('Failed to create account');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
             <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>New Account</Text>
        <TouchableOpacity onPress={handleSave}>
             <Text style={{ color: colors.accent, fontWeight: 'bold' }}>SAVE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        <View>
            <Text style={[styles.label, {color: colors.textSecondary}]}>Account Name</Text>
            <TextInput 
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. HDFC Bank"
                placeholderTextColor={colors.textSecondary}
            />
        </View>

        <View>
            <Text style={[styles.label, {color: colors.textSecondary}]}>Type</Text>
            <View style={{flexDirection:'row', gap:10, flexWrap:'wrap'}}>
                {['General', 'Cash', 'Bank', 'Savings', 'Credit Card'].map(t => (
                    <TouchableOpacity
                        key={t}
                        style={[styles.chip, { 
                            backgroundColor: type === t ? colors.accent : colors.surface,
                            borderColor: colors.border
                        }]}
                        onPress={() => setType(t)}
                    >
                        <Text style={{color: type === t ? '#fff' : colors.text}}>{t}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        <View>
            <Text style={[styles.label, {color: colors.textSecondary}]}>Starting Balance (Optional)</Text>
            <TextInput 
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={initialBalance}
                onChangeText={setInitialBalance}
                placeholder="e.g. 5000"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
            />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '600' },
  label: { marginBottom: 8, fontSize: 14, fontWeight: '600' },
  input: { padding: 12, borderRadius: 8, borderWidth: 1, fontSize: 16 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 }
});