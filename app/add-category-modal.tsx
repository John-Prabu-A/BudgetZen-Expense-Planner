import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { createCategory } from '@/lib/finance';
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
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const categoryColors = [
    '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF',
    '#FF8B94', '#95E1D3', '#6BCB77', '#4D96FF',
    '#FFB700', '#FF6B9D', '#FF9999', '#99CCFF',
];

const categoryIcons = [
    'home', 'food', 'shopping', 'movie', 'car', 'lightning-bolt',
    'briefcase', 'laptop', 'chart-line', 'gift', 'heart', 'star',
];

export default function AddCategoryModal() {
    const router = useRouter();
    const { isDark, colors } = useTheme();
    const { user, session } = useAuth();

    const [categoryType, setCategoryType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE');
    const [categoryName, setCategoryName] = useState('');
    const [selectedColor, setSelectedColor] = useState(categoryColors[0]);
    const [selectedIcon, setSelectedIcon] = useState(categoryIcons[0]);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!categoryName) {
            Alert.alert('Error', 'Please enter a category name');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'User not authenticated');
            return;
        }

        try {
            setSaving(true);
            const categoryData = {
                user_id: user.id,
                name: categoryName,
                type: categoryType.toLowerCase(),
                icon: selectedIcon,
                color: selectedColor,
            };
            await createCategory(categoryData);
            Alert.alert('Success', 'Category created successfully!');
            router.back();
        } catch (error) {
            console.error('Error saving category:', error);
            Alert.alert('Error', 'Failed to save category');
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
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Add Category</Text>
                    <View style={{ width: 24 }} />
                </View>

                {/* Category Type */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>Category Type</Text>
                    <View style={styles.typeContainer}>
                        {(['EXPENSE', 'INCOME'] as const).map((type) => (
                            <TouchableOpacity
                                key={type}
                                style={[
                                    styles.typeButton,
                                    {
                                        backgroundColor:
                                            categoryType === type ? colors.accent : colors.surface,
                                        borderColor: colors.border,
                                    },
                                ]}
                                onPress={() => setCategoryType(type)}
                            >
                                <Text
                                    style={[
                                        styles.typeButtonText,
                                        {
                                            color:
                                                categoryType === type ? '#FFFFFF' : colors.text,
                                        },
                                    ]}
                                >
                                    {type}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Category Name */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>Category Name</Text>
                    <TextInput
                        style={[
                            styles.input,
                            {
                                borderColor: colors.border,
                                backgroundColor: colors.surface,
                                color: colors.text,
                            },
                        ]}
                        placeholder="e.g., Groceries, Salary, etc."
                        placeholderTextColor={colors.textSecondary}
                        value={categoryName}
                        onChangeText={setCategoryName}
                        editable={!saving}
                        maxLength={20}
                    />
                </View>

                {/* Color Picker */}
                                <View style={styles.section}>
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

                {/* Preview */}
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>Preview</Text>
                    <View
                        style={[
                            styles.preview,
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
                                size={32}
                                color="#FFFFFF"
                            />
                        </View>
                        <Text style={[styles.previewText, { color: colors.text }]}>
                            {categoryName || 'Category Name'}
                        </Text>
                    </View>
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
                        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                            Save Category
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
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    typeContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    typeButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
    },
    typeButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 14,
    },
    // Color Grid
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        justifyContent: 'space-evenly',
        marginBottom: -50,
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
        marginBottom: -60,
        justifyContent: 'space-between',
    },
    iconOption: {
        width: '22.5%',
        aspectRatio: 1,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    preview: {
        paddingHorizontal: 16,
        paddingVertical: 20,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        borderWidth: 1,
    },
    previewIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewText: {
        fontSize: 16,
        fontWeight: '600',
        flex: 1,
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
