import { useAuth } from '@/context/Auth';
import { useTheme } from '@/context/Theme';
import { useToast } from '@/context/Toast';
import { createCategory } from '@/lib/finance';
import { TempStore } from '@/lib/tempStore'; // Import Helper
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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

const ICONS = ['food', 'bus', 'home', 'shopping', 'medical-bag', 'school', 'gamepad', 'gift', 'bank', 'cash', 'chart-line', 'briefcase'];
const COLORS = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#1A535C', '#F7FFF7', '#FF9F1C', '#2EC4B6', '#E71D36'];

export default function AddCategoryModal() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const toast = useToast();
  const params = useLocalSearchParams();

  const [name, setName] = useState('');
  const [type, setType] = useState((params.type as string) || 'EXPENSE');
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name) return toast.error('Name is required');
    
    setSaving(true);
    try {
        const newCat = await createCategory({
            user_id: user?.id,
            name,
            type: type.toLowerCase(),
            icon: selectedIcon,
            color: selectedColor
        });

        // 1. Set the temp store
        if (newCat?.id) {
            TempStore.setNewCategory(newCat.id);
        }

        // 2. Just go back. The parent's useFocusEffect will handle the rest.
        toast.success('Category created');
        router.back();

    } catch (e) {
        console.error(e);
        toast.error('Failed to create category');
    } finally {
        setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
             <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>New Category</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
             <Text style={{ color: colors.accent, fontWeight: 'bold' }}>SAVE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 20 }}>
        
        {/* Name Input */}
        <View>
            <Text style={[styles.label, {color: colors.textSecondary}]}>Name</Text>
            <TextInput 
                style={[styles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Groceries"
                placeholderTextColor={colors.textSecondary}
            />
        </View>

        {/* Type Selector */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
            {['INCOME', 'EXPENSE'].map(t => (
                <TouchableOpacity 
                    key={t}
                    style={[styles.typeBtn, { 
                        backgroundColor: type === t ? colors.accent : colors.surface,
                        borderColor: colors.border 
                    }]}
                    onPress={() => setType(t)}
                >
                    <Text style={{ color: type === t ? '#fff' : colors.text }}>{t}</Text>
                </TouchableOpacity>
            ))}
        </View>

        {/* Icon Grid */}
        <View>
            <Text style={[styles.label, {color: colors.textSecondary}]}>Icon</Text>
            <View style={styles.grid}>
                {ICONS.map(icon => (
                    <TouchableOpacity 
                        key={icon}
                        style={[styles.gridItem, { 
                            backgroundColor: selectedIcon === icon ? colors.accent : colors.surface,
                            borderColor: colors.border
                        }]}
                        onPress={() => setSelectedIcon(icon)}
                    >
                        <MaterialCommunityIcons name={icon as any} size={24} color={selectedIcon === icon ? '#fff' : colors.text} />
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        {/* Color Grid */}
        <View>
            <Text style={[styles.label, {color: colors.textSecondary}]}>Color</Text>
            <View style={styles.grid}>
                {COLORS.map(color => (
                    <TouchableOpacity 
                        key={color}
                        style={[styles.gridItem, { backgroundColor: color }]}
                        onPress={() => setSelectedColor(color)}
                    >
                        {selectedColor === color && <MaterialCommunityIcons name="check" size={20} color="#fff" />}
                    </TouchableOpacity>
                ))}
            </View>
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
  typeBtn: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 8, borderWidth: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridItem: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'transparent' }
});