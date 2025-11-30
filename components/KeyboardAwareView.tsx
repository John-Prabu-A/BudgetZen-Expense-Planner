import React, { ReactNode } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ScrollViewProps,
    StyleSheet,
} from 'react-native';

interface KeyboardAwareViewProps extends Omit<ScrollViewProps, 'children'> {
  children: ReactNode;
  isKeyboardOpen?: boolean;
  scrollViewRef?: React.RefObject<ScrollView>;
}

/**
 * KeyboardAwareView Component
 * 
 * A wrapper component that automatically handles keyboard appearance
 * and adjusts the view to ensure input fields remain visible.
 * 
 * Features:
 * - Automatic keyboard avoidance
 * - Platform-specific behavior (iOS vs Android)
 * - Smooth scrolling when keyboard appears
 * - Proper spacing and padding management
 * 
 * Usage:
 * ```tsx
 * <KeyboardAwareView>
 *   <TextInput />
 *   <Button />
 * </KeyboardAwareView>
 * ```
 */
export const KeyboardAwareView = React.forwardRef<
  ScrollView,
  KeyboardAwareViewProps
>(({ children, isKeyboardOpen = false, scrollViewRef, ...props }, ref) => {
  const innerRef = scrollViewRef || ref;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        ref={innerRef}
        showsVerticalScrollIndicator={false}
        bounces={false}
        scrollEnabled={isKeyboardOpen}
        onScrollBeginDrag={() => Keyboard.dismiss()}
        contentContainerStyle={[
          styles.contentContainer,
          isKeyboardOpen && styles.contentContainerKeyboardOpen,
        ]}
        {...props}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
});

KeyboardAwareView.displayName = 'KeyboardAwareView';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  contentContainerKeyboardOpen: {
    justifyContent: 'flex-start',
    paddingVertical: 16,
  },
});

export default KeyboardAwareView;
