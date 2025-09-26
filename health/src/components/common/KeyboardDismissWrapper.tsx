import React from 'react';
import {
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  StyleSheet,
} from 'react-native';

interface KeyboardDismissWrapperProps {
  children: React.ReactNode;
  style?: any;
  scrollable?: boolean;
  keyboardAvoidingView?: boolean;
}

const KeyboardDismissWrapper: React.FC<KeyboardDismissWrapperProps> = ({
  children,
  style,
  scrollable = false,
  keyboardAvoidingView = true,
}) => {
  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  const content = (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={[styles.container, style]}>
        {scrollable ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </View>
    </TouchableWithoutFeedback>
  );

  if (keyboardAvoidingView) {
    return (
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default KeyboardDismissWrapper;
