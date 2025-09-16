import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface AlertProps {
  type?: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
  onClose?: () => void;
  style?: any;
}

const Alert: React.FC<AlertProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  style,
}) => {
  const getAlertStyles = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#E8F5E8', borderColor: '#4CAF50' };
      case 'warning':
        return { backgroundColor: '#FFF3E0', borderColor: '#FF9800' };
      case 'error':
        return { backgroundColor: '#FFEBEE', borderColor: '#F44336' };
      default:
        return { backgroundColor: '#E3F2FD', borderColor: '#2196F3' };
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return '#2E7D32';
      case 'warning':
        return '#F57C00';
      case 'error':
        return '#C62828';
      default:
        return '#1565C0';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  return (
    <View style={[styles.container, getAlertStyles(), style]}>
      <View style={styles.content}>
        <Text style={styles.icon}>{getIcon()}</Text>
        <View style={styles.textContainer}>
          {title && (
            <Text style={[styles.title, { color: getTextColor() }]}>
              {title}
            </Text>
          )}
          <Text style={[styles.message, { color: getTextColor() }]}>
            {message}
          </Text>
        </View>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={[styles.closeText, { color: getTextColor() }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    marginVertical: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    marginLeft: 12,
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Alert;
