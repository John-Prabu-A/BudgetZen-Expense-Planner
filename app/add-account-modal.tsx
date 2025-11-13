import { useAuth } from '@/context/Auth';
import { createAccount } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';

const accountTypes = [
    { id: '1', name: 'Bank Account', icon: 'bank' },
    { id: '2', name: 'Credit Card', icon: 'credit-card' },
    { id: '3', name: 'Cash', icon: 'wallet' },
    { id: '4', name: 'Investment', icon: 'trending-up' },
    { id: '5', name: 'Savings', icon: 'piggy-bank' },
    { id: '6', name: 'Loan', icon: 'file-document' },
];

export default function AddAccountModal() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { user, session } = useAuth();
    const colors = {
        background: isDark ? '#1A1A1A' : '#FFFFFF',
        surface: isDark ? '#262626' : '#F5F5F5',
        text: isDark ? '#FFFFFF' : '#000000',
        textSecondary: isDark ? '#A0A0A0' : '#666666',
        border: isDark ? '#404040' : '#E5E5E5',
        accent: '#0284c7',
    };

    const [selectedType, setSelectedType] = useState(accountTypes[0]);
    const [accountName, setAccountName] = useState('');
    const [initialBalance, setInitialBalance] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!accountName || !initialBalance) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        try {
            setSaving(true);
            const accountData = {
                user_id: user.id,
                name: accountName,
                type: selectedType.name,
                initial_balance: parseFloat(initialBalance),
            };
            await createAccount(accountData);
            Alert.alert('Success', 'Account created successfully!');
            router.back();
        } catch (error) {
            console.error('Error saving account:', error);
            Alert.alert('Error', 'Failed to save account');
        } finally {
            setSaving(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Add Account</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Account Type Selection */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>Account Type</Text>
                    <View style={styles.typeGrid}>
                        {accountTypes.map((type) => (
                            <TouchableOpacity
                                key={type.id}
                                style={[
                                    styles.typeButton,
                                    {
                                        backgroundColor:
                                            selectedType.id === type.id ? colors.accent : colors.surface,
                                        borderColor: colors.border,
                                    },
                                ]}
                                onPress={() => setSelectedType(type)}
                            >
                                <MaterialCommunityIcons
                                    name={type.icon as any}
                                    size={24}
                                    color={
                                        selectedType.id === type.id ? '#FFFFFF' : colors.accent
                                    }
                                />
                                <Text
                                    style={[
                                        styles.typeName,
                                        {
                                            color:
                                                selectedType.id === type.id
                                                    ? '#FFFFFF'
                                                    : colors.text,
                                        },
                                    ]}
                                >
                                    {type.name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Account Name */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>Account Name</Text>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                borderColor: colors.border,
                                backgroundColor: colors.surface,
                                color: colors.text,
                            },
                        ]}
                        placeholder="e.g., My Savings Account"
                        placeholderTextColor={colors.textSecondary}
                        value={accountName}
                        onChangeText={setAccountName}
                    />
                </View>

                {/* Initial Balance */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>Initial Balance (₹)</Text>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                borderColor: colors.border,
                                backgroundColor: colors.surface,
                                color: colors.text,
                            },
                        ]}
                        placeholder="Enter initial balance"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="decimal-pad"
                        value={initialBalance}
                        onChangeText={setInitialBalance}
                    />
                </View>

                {/* Notes */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>Notes (Optional)</Text>
                    <TextInput
                        style={[
                            styles.textArea,
                            {
                                borderColor: colors.border,
                                backgroundColor: colors.surface,
                                color: colors.text,
                            },
                        ]}
                        placeholder="Add notes about this account"
                        placeholderTextColor={colors.textSecondary}
                        multiline
                        numberOfLines={4}
                        value={notes}
                        onChangeText={setNotes}
                    />
                </View>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                            },
                        ]}
                        onPress={() => router.back()}
                    >
                        <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: colors.accent }]}
                        onPress={handleSave}
                    >
                        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Save Account</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    section: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    typeButton: {
        width: '31%',
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        gap: 6,
    },
    typeName: {
        fontSize: 11,
        fontWeight: '600',
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        minHeight: 100,
        textAlignVertical: 'top',
        fontSize: 14,
    },
    buttonContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        gap: 12,
        marginBottom: 16,
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'transparent',
    },
    buttonText: {
        fontSize: 14,
        fontWeight: '700',
    },
});
