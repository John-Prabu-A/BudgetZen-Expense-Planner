import { useAuth } from '@/context/Auth';
import { useAppColorScheme } from '@/hooks/useAppColorScheme';
import { updateCategory } from '@/lib/finance';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Keyboard,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const categoryColors = [
    '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF',
    '#FF8B94', '#95E1D3', '#6BCB77', '#4D96FF',
    '#FFB700', '#FF6B9D', '#FF9999', '#99CCFF',
];

const categoryIcons = [
    'home', 'food', 'shopping', 'movie', 'car', 'lightning-bolt',
    'briefcase', 'laptop', 'chart-line', 'gift', 'heart', 'star',
];

export default function EditCategoryModal() {
    const router = useRouter();
    const colorScheme = useAppColorScheme();
    const isDark = colorScheme === 'dark';
    const { user } = useAuth();
    const params = useLocalSearchParams();

    const colors = {
        background: isDark ? '#1A1A1A' : '#FFFFFF',
        surface: isDark ? '#262626' : '#F5F5F5',
        text: isDark ? '#FFFFFF' : '#000000',
        textSecondary: isDark ? '#A0A0A0' : '#666666',
        border: isDark ? '#404040' : '#E5E5E5',
        accent: '#0284c7',
        error: '#EF4444',
    };

    // Parse category data from route params
    const categoryData = params.category ? JSON.parse(params.category as string) : null;

    const [categoryName, setCategoryName] = useState('');
    const [selectedColor, setSelectedColor] = useState(categoryColors[0]);
    const [selectedIcon, setSelectedIcon] = useState(categoryIcons[0]);
    const [saving, setSaving] = useState(false);

    // Initialize with one-time effect only, don't re-run
    useEffect(() => {
        if (categoryData) {
            setCategoryName(categoryData.name || '');
            setSelectedColor(categoryData.color || categoryColors[0]);
            setSelectedIcon(categoryData.icon || categoryIcons[0]);
        }
    }, []);

    const handleSave = async () => {
        if (!categoryName.trim()) {
            Alert.alert('Error', 'Please enter a category name');
            return;
        }

        if (!categoryData?.id) {
            Alert.alert('Error', 'Category ID is missing');
            return;
        }

        try {
            setSaving(true);
            const updatedData = {
                name: categoryName.trim(),
                icon: selectedIcon,
                color: selectedColor,
            };

            await updateCategory(categoryData.id, updatedData);
            Alert.alert('Success', 'Category updated successfully!');
            router.back();
        } catch (error) {
            console.error('Error updating category:', error);
            Alert.alert('Error', 'Failed to update category');
        } finally {
            setSaving(false);
        }
    };

    if (!categoryData) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Text style={[styles.errorText, { color: colors.text }]}>
                    Category data not found
                </Text>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                onScrollBeginDrag={() => Keyboard.dismiss()}
            >
                {/* Header */}
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity 
                        onPress={() => router.back()}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <MaterialCommunityIcons name="close" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        Edit Category
                    </Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Live Preview (Top Priority) */}
                <View
                    style={[
                        styles.previewCard,
                        {
                            backgroundColor: colors.surface,
                            borderColor: colors.border,
                        },
                    ]}
                >
                    <View
                        style={[
                            styles.previewIcon,
                            { backgroundColor: selectedColor },
                        ]}
                    >
                        <MaterialCommunityIcons
                            name={selectedIcon as any}
                            size={28}
                            color="#FFFFFF"
                        />
                    </View>
                    <View style={styles.previewTextContainer}>
                        <Text style={[styles.previewName, { color: colors.text }]}>
                            {categoryName.trim() || 'Category Name'}
                        </Text>
                        <Text style={[styles.previewSubtext, { color: colors.textSecondary }]}>
                            Preview
                        </Text>
                    </View>
                </View>

                {/* Category Name Input */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>Name</Text>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.surface,
                                color: colors.text,
                                borderColor: colors.border,
                            },
                        ]}
                        placeholder="Enter category name"
                        placeholderTextColor={colors.textSecondary}
                        value={categoryName}
                        onChangeText={setCategoryName}
                        editable={!saving}
                        maxLength={20}
                    />
                </View>

                {/* Color Picker */}
                <View>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>Color</Text>
                    <View style={styles.colorGrid}>
                        {categoryColors.map((color) => (
                            <TouchableOpacity
                                key={color}
                                style={[
                                    styles.colorOption,
                                    {
                                        backgroundColor: color,
                                        borderColor: selectedColor === color ? colors.text : colors.border,
                                        borderWidth: 1,
                                        // marginBottom: 10,
                                    },
                                ]}
                                onPress={() => setSelectedColor(color)}
                                disabled={saving}
                                activeOpacity={0.7}
                            >
                            <MaterialCommunityIcons
                                name="check"
                                size={24}
                                color={selectedColor === color ? "#FFFFFF" : color}
                                hidden={selectedColor !== color}
                                style={[selectedColor === color ? styles.checkmark : undefined, { paddingBottom: 16 }]}

                            />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Icon Picker */}
                <View style={styles.section}>
                    <Text style={[styles.sectionLabel, { color: colors.text }]}>Icon</Text>
                    <View style={styles.iconGrid}>
                        {categoryIcons.map((icon) => (
                            <TouchableOpacity
                                key={icon}
                                style={[
                                    styles.iconOption,
                                    {
                                        backgroundColor:
                                            selectedIcon === icon
                                                ? colors.accent
                                                : colors.surface,
                                        borderColor: colors.border,
                                        // borderWidth: selectedIcon === icon ? 0 : 0.5,
                                        paddingBottom: 8,
                                    },

                                ]}
                                onPress={() => setSelectedIcon(icon)}
                                disabled={saving}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons
                                    name={icon as any}
                                    size={22}
                                    // scale 1.5
                                    style={{
                                        transform: [{ scale: selectedIcon === icon ? 1.3 : 1 }],
                                    }}
                                    color={
                                        selectedIcon === icon ? '#FFFFFF' : colors.text
                                    }
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[
                            styles.cancelButton,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                            },
                        ]}
                        onPress={() => router.back()}
                        disabled={saving}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.buttonText, { color: colors.text }]}>
                            Cancel
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            {
                                backgroundColor: colors.accent,
                                opacity: saving ? 0.6 : 1,
                            },
                        ]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.8}
                    >
                        {saving ? (
                            <MaterialCommunityIcons name="loading" size={18} color="#FFFFFF" />
                        ) : (
                            <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
                        )}
                        <Text style={styles.saveButtonText}>
                            {saving ? 'Saving' : 'Save Changes'}
                        </Text>
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
        paddingVertical: 12,
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 0,
        paddingVertical: 14,
        marginBottom: 16,
        borderBottomWidth: 0.5,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    // Preview Card (Top)
    previewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
        marginBottom: 16,
    },
    previewIcon: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewTextContainer: {
        flex: 1,
    },
    previewName: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 2,
    },
    previewSubtext: {
        fontSize: 12,
        fontWeight: '500',
    },
    // Sections
    section: {
        marginBottom: 14,
    },
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    // Input
    input: {
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        fontWeight: '500',
    },
    // Color Grid
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'space-between',
    },
    colorOption: {
        width: '22.5%',
        aspectRatio: 1,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    // Icon Grid
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'space-between',
    },
    iconOption: {
        width: '22.5%',
        aspectRatio: 1,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Buttons
    buttonContainer: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 8,
    },
    cancelButton: {
        flex: 1,
        paddingVertical: 11,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    saveButton: {
        flex: 1.2,
        paddingVertical: 11,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        gap: 6,
    },
    buttonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 20,
    },
});
