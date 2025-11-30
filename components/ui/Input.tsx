import React from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';

export const Input = React.forwardRef<TextInput, TextInputProps>((props, ref) => {
  return (
    <TextInput
      ref={ref}
      {...props}
      style={[styles.input, props.style]}
      placeholderTextColor={props.placeholderTextColor || '#999'}
    />
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  input: {
    padding: 0,
    margin: 0,
    color: '#000',
    fontSize: 15,
    fontWeight: '500',
  },
});

export default Input;