import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Platform } from 'react-native';
import LottieView from 'lottie-react-native';

interface SuccessOverlayProps {
  visible: boolean;
  message?: string;
  onHide?: () => void;
  autoHideMs?: number;
}

const SuccessOverlay: React.FC<SuccessOverlayProps> = ({
  visible,
  message = 'Success',
  onHide,
  autoHideMs = 3000,
}) => {
  // Use any for ref to access play/reset across SDK typings
  const animRef = useRef<any>(null);
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (visible && autoHideMs > 0) {
      // Restart animation on each show
      if (Platform.OS !== 'web') {
        // Small delay ensures the view is mounted before controlling the animation
        setTimeout(() => {
          animRef.current?.reset?.();
          animRef.current?.play?.();
        }, 0);
      }
      timer = setTimeout(() => {
        onHide?.();
      }, autoHideMs);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible, autoHideMs, onHide]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onHide}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {Platform.OS === 'web' ? (
            <View style={styles.webIconContainer}>
              <Text style={styles.webIcon}>✅</Text>
            </View>
          ) : (
            <LottieView
              source={require('../../../assets/Icons/successIcon/success.json')}
              autoPlay
              loop={false}
              style={styles.lottie}
              ref={animRef}
            />
          )}
          {!!message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'transparent',
    borderRadius: 16,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    // Remove card shadow/elevation to avoid visible box behind Lottie
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  lottie: {
    width: 140,
    height: 140,
  },
  webIconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webIcon: {
    fontSize: 64,
  },
  message: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: Platform.OS === 'ios' ? '600' : '700',
    color: '#2E7D32',
    textAlign: 'center',
  },
});

export default SuccessOverlay;
