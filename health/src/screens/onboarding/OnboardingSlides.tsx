import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AnimatedParticles from '@/components/common/AnimatedParticles';

const { width, height } = Dimensions.get('window');

interface OnboardingSlidesProps {
  onComplete: () => void;
}

const slides = [
  {
    id: 1,
    title: 'Welcome to Your Health Journey',
    subtitle: 'Track your health metrics with precision and get personalized insights to live your best life.',
    icon: 'heart-outline',
    color: '#4CAF50',
  },
  {
    id: 2,
    title: 'Smart Health Monitoring',
    subtitle: 'Monitor blood sugar, blood pressure, weight, and more with intelligent tracking and analysis.',
    icon: 'analytics-outline',
    color: '#66BB6A',
  },
  {
    id: 3,
    title: 'Expert Guidance Always',
    subtitle: 'Get personalized recommendations and insights backed by healthcare professionals.',
    icon: 'medical-outline',
    color: '#81C784',
  },
];

const OnboardingSlides: React.FC<OnboardingSlidesProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const iconScaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start entrance animations
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentIndex]);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      // Animate out current slide
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        scrollViewRef.current?.scrollTo({
          x: nextIndex * width,
          animated: true,
        });
        
        // Reset animations for new slide
        slideAnim.setValue(0);
        iconScaleAnim.setValue(0);
        
        // Animate in new slide
        Animated.spring(iconScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }).start();
      });
    } else {
      onComplete();
    }
  };

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.floor(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== currentIndex) {
      setCurrentIndex(index);
      // Reset icon animation for new slide
      iconScaleAnim.setValue(0);
      Animated.spring(iconScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <View style={styles.gradientBackground}>
        <View style={[styles.gradientLayer, { backgroundColor: slides[currentIndex].color }]} />
        <View style={styles.gradientOverlay} />
      </View>

      {/* Animated Content Container */}
      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
        {/* Slides */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.scrollView}
          bounces={false}
        >
          {slides.map((slide, index) => (
            <View key={slide.id} style={styles.slide}>
              {/* Animated Icon Container */}
              <Animated.View 
                style={[
                  styles.iconContainer,
                  {
                    transform: [{ scale: iconScaleAnim }]
                  }
                ]}
              >
                <View style={[styles.iconCircle, { backgroundColor: slide.color }]}>
                  <Ionicons 
                    name={slide.icon as any} 
                    size={80} 
                    color="white" 
                  />
                </View>
                
                {/* Floating particles animation */}
                <AnimatedParticles color={slide.color} count={8} />
              </Animated.View>
              
              {/* Text Content */}
              <Animated.View 
                style={[
                  styles.textContainer,
                  { transform: [{ translateX: slideAnim }] }
                ]}
              >
                <Text style={styles.title}>{slide.title}</Text>
                <Text style={styles.subtitle}>{slide.subtitle}</Text>
              </Animated.View>
            </View>
          ))}
        </ScrollView>

        {/* Enhanced Pagination Dots */}
        <View style={styles.pagination}>
          {slides.map((slide, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                index === currentIndex ? 
                  [styles.activeDot, { backgroundColor: slide.color }] : 
                  styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          {currentIndex < slides.length - 1 ? (
            <TouchableOpacity 
              style={[styles.nextButton, { backgroundColor: slides[currentIndex].color }]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.getStartedButton, { backgroundColor: slides[currentIndex].color }]}
              onPress={onComplete}
              activeOpacity={0.8}
            >
              <Text style={styles.getStartedButtonText}>Get Started</Text>
              <Ionicons name="checkmark-circle" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fffe',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientLayer: {
    flex: 1,
    opacity: 0.1,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingTop: 60,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 60,
    position: 'relative',
  },
  iconCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 18,
    color: '#546E7A',
    textAlign: 'center',
    lineHeight: 28,
    fontWeight: '400',
    letterSpacing: 0.2,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
    paddingBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 6,
  },
  activeDot: {
    width: 32,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: '#E0E0E0',
  },
  actionContainer: {
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
    letterSpacing: 0.5,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 35,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  getStartedButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: 'white',
    marginRight: 10,
    letterSpacing: 0.8,
  },
});

export default OnboardingSlides;
