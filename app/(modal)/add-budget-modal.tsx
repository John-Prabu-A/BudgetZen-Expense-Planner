import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { createBudget, readCategories, updateBudget } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AddBudgetModal() {
    const router = useRouter();
    const { user, session } = useAuth();
    const { isDark, colors } = useTheme();
    const params = useLocalSearchParams();
    const incomingBudget = params.budget ? JSON.parse(params.budget as string) : null;

    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [budgetAmount, setBudgetAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);

    useEffect(() => {
        loadCategories();
    }, []);

    useFocusEffect(
        useCallback(() => {
            if (user && session) {
                loadCategories();
            }
        }, [user, session])
    );

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await readCategories();
            setCategories(data || []);
            
            if (incomingBudget) {
                // Edit mode: prefill with existing budget data
                setEditingBudgetId(incomingBudget.id || null);
                setBudgetAmount(String(incomingBudget.amount || incomingBudget.limit || ''));
                setNotes(incomingBudget.notes || '');
                
                // Find and select the category
                const category = (data || []).find((c) => c.id === incomingBudget.category_id);
                if (category) setSelectedCategory(category);
            } else if (data && data.length > 0) {
                // Create mode: set first category as default
                setSelectedCategory(data[0]);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
            Alert.alert('Error', 'Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!budgetAmount || !selectedCategory) {
            Alert.alert('Error', 'Please fill in all required fields and select a category');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        try {
            setSaving(true);
            const budgetData = {
                category_id: selectedCategory.id,
                amount: parseFloat(budgetAmount),
                notes: notes || null,
            };

            if (editingBudgetId) {
                // Update existing budget
                await updateBudget(editingBudgetId, budgetData);
                Alert.alert('Success', 'Budget updated successfully!');
            } else {
                // Create new budget
                const newBudgetData = {
                    ...budgetData,
                    user_id: user.id,
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0],
                };
                await createBudget(newBudgetData);
                Alert.alert('Success', 'Budget created successfully!');
            }
            router.back();
        } catch (error) {
            console.error('Error saving budget:', error);
            Alert.alert('Error', editingBudgetId ? 'Failed to update budget' : 'Failed to save budget');
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {editingBudgetId ? 'Edit Budget' : 'Add Budget'}
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Category Selection */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>Select Category</Text>
                    {categories.length === 0 ? (
                        <View
                            style={[
                                styles.emptyStateContainer,
                                { backgroundColor: colors.surface, borderColor: colors.border },
                            ]}
                        >
                            <MaterialCommunityIcons
                                name="folder-open"
                                size={48}
                                color={colors.textSecondary}
                            />
                            <Text style={[styles.emptyStateText, { color: colors.text }]}>
                                No Categories Found
                            </Text>
                            <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
                                Create a category first to set up your budgets
                            </Text>
                            <TouchableOpacity
                                style={[styles.createButton, { backgroundColor: colors.accent }]}
                                onPress={() => router.push('/(modal)/add-category-modal')}
                            >
                                <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" />
                                <Text style={styles.createButtonText}>Create Category</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.categoryGrid}>
                            {categories.map((category) => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[
                                        styles.categoryButton,
                                        {
                                            backgroundColor:
                                                selectedCategory?.id === category.id
                                                    ? category.color
                                                    : colors.surface,
                                            borderColor: colors.border,
                                        },
                                    ]}
                                    onPress={() => setSelectedCategory(category)}
                                >
                                    <MaterialCommunityIcons
                                        name={category.icon as any}
                                        size={28}
                                        color={
                                            selectedCategory?.id === category.id ? '#FFFFFF' : colors.accent
                                        }
                                    />
                                    <Text
                                        style={[
                                            styles.categoryName,
                                            {
                                                color:
                                                    selectedCategory?.id === category.id
                                                        ? '#FFFFFF'
                                                        : colors.text,
                                            },
                                        ]}
                                    >
                                        {category.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                {/* Budget Amount */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>Budget Amount (₹)</Text>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                borderColor: colors.border,
                                backgroundColor: colors.surface,
                                color: colors.text,
                            },
                        ]}
                        placeholder="Enter budget amount"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="decimal-pad"
                        value={budgetAmount}
                        onChangeText={setBudgetAmount}
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
                        placeholder="Add notes about this budget"
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
                        disabled={saving}
                    >
                        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                            {saving ? 'Saving...' : (editingBudgetId ? 'Update Budget' : 'Save Budget')}
                        </Text>
                    </TouchableOpacity>
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
    categoryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    categoryButton: {
        width: '48%',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        gap: 8,
    },
    categoryName: {
        fontSize: 12,
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
    emptyStateContainer: {
        borderWidth: 2,
        borderRadius: 12,
        paddingVertical: 32,
        paddingHorizontal: 16,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        borderStyle: 'dashed',
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
    },
    emptyStateSubtext: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 8,
    },
    createButton: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 8,
    },
    createButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
