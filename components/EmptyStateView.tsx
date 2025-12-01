import { useTheme } from '@/context/Theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle
} from 'react-native';

export interface EmptyStateViewProps {
  /**
   * Icon name from MaterialCommunityIcons
   * Examples: 'book-open-blank-variant', 'chart-box-outline', 'wallet-outline'
   */
  icon: string;

  /**
   * Main title of the empty state
   * Examples: 'No Records Yet', 'No Data Available'
   */
  title: string;

  /**
   * Detailed explanation of the empty state
   * Can include newlines for formatting
   */
  subtitle: string;

  /**
   * Optional button text
   * If provided, a button will be shown
   */
  actionText?: string;

  /**
   * Callback when action button is pressed
   */
  onAction?: () => void;

  /**
   * Optional custom container style
   */
  containerStyle?: ViewStyle;

  /**
   * Show button as secondary (outline) style
   * @default false
   */
  isSecondary?: boolean;
}

/**
 * Professional empty state component used across the app
 * when no data is available to display
 *
 * @example
 * ```tsx
 * <EmptyStateView
 *   icon="book-open-blank-variant"
 *   title="No Records Yet"
 *   subtitle="Create your first income or expense record to get started."
 *   actionText="Add Record"
 *   onAction={() => router.push('/(modal)/add-record-modal')}
 * />
 * ```
 */
export const EmptyStateView = React.memo(
  ({
    icon,
    title,
    subtitle,
    actionText,
    onAction,
    containerStyle,
    isSecondary = false,
  }: EmptyStateViewProps) => {
    const { isDark, colors } = useTheme();

    return (
      <View
        style={[
          styles.container,
          { backgroundColor: colors.background },
          containerStyle,
        ]}
      >
        {/* Icon */}
        <MaterialCommunityIcons
          name={icon as any}
          size={56}
          color={colors.textSecondary}
          style={styles.icon}
        />

        {/* Title */}
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          {title}
        </Text>

        {/* Subtitle */}
        <Text
          style={[
            styles.subtitle,
            {
              color: colors.textSecondary,
            },
          ]}
        >
          {subtitle}
        </Text>

        {/* Action Button */}
        {actionText && onAction && (
          <TouchableOpacity
            style={[
              styles.button,
              isSecondary
                ? {
                    borderWidth: 2,
                    borderColor: colors.accent,
                    backgroundColor: 'transparent',
                  }
                : {
                    backgroundColor: colors.accent,
                  },
            ]}
            onPress={onAction}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="plus-circle"
              size={20}
              color={isSecondary ? colors.accent : '#ffffff'}
            />
            <Text
              style={[
                styles.buttonText,
                {
                  color: isSecondary ? colors.accent : '#ffffff',
                },
              ]}
            >
              {actionText}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

EmptyStateView.displayName = 'EmptyStateView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  icon: {
    marginBottom: 24,
    opacity: 0.6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    minWidth: 160,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
