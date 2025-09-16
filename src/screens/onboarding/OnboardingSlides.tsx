import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Button from '@/components/common/Button';

const { width, height } = Dimensions.get('window');

interface OnboardingSlidesProps {
  onComplete: () => void;
}

const slides = [
  {
    id: 1,
    title: 'Online Diabetes Risk Prediction System',
    subtitle: 'Track and predict your health risks with ease.',
    image: require('../../../assets/images/illustrations/onboarding1.jpg'),
  },
  {
    id: 2,
    title: "Our Doctor's are Always Ready",
    subtitle: 'Access guidance and tips trusted by healthcare professionals.',
    image: require('../../../assets/images/illustrations/onboarding2.jpg'),
  },
  {
    id: 3,
    title: 'Our Prediction are Ready to Handover',
    subtitle: 'Get personalized reports and take the first step today.',
    image: require('../../../assets/images/illustrations/onboarding3.jpg'),
  },
];

const OnboardingSlides: React.FC<OnboardingSlidesProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * width,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = Math.floor(event.nativeEvent.contentOffset.x / slideSize);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.container}>
      {/* Skip Button */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.scrollView}
      >
        {slides.map((slide, index) => (
          <View key={slide.id} style={styles.slide}>
            <View style={styles.imageContainer}>
              <Image
                source={slide.image}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </View>

            {/* Get Started Button - Only on last slide */}
            {index === slides.length - 1 && (
              <View style={styles.buttonContainer}>
                <Button
                  title="Get Started"
                  onPress={onComplete}
                  variant="primary"
                  size="large"
                  style={styles.getStartedButton}
                />
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>

      {/* Next Button - Only show on first two slides */}
      {currentIndex < slides.length - 1 && (
        <View style={styles.navigationContainer}>
          <Button
            title="Next"
            onPress={handleNext}
            variant="primary"
            size="medium"
            style={styles.nextButton}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  imageContainer: {
    flex: 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  image: {
    width: width * 0.75,
    height: height * 0.35,
  },
  textContainer: {
    flex: 0.3,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    flex: 0.2,
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
  },
  getStartedButton: {
    borderRadius: 25,
    paddingVertical: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#4CAF50',
    width: 20,
  },
  inactiveDot: {
    backgroundColor: '#E0E0E0',
  },
  navigationContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  nextButton: {
    borderRadius: 25,
  },
});

export default OnboardingSlides;
