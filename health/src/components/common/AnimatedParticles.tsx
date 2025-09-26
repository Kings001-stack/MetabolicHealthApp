import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface AnimatedParticlesProps {
  color: string;
  count?: number;
}

const AnimatedParticles: React.FC<AnimatedParticlesProps> = ({ 
  color, 
  count = 8 
}) => {
  const particles = useRef(
    Array.from({ length: count }, () => ({
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      opacity: new Animated.Value(0.3),
      scale: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    const animations = particles.map((particle, index) => {
      const delay = index * 200;
      
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(particle.translateY, {
              toValue: -100 - Math.random() * 50,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.timing(particle.translateX, {
              toValue: (Math.random() - 0.5) * 100,
              duration: 3000 + Math.random() * 2000,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(particle.opacity, {
                toValue: 0.8,
                duration: 1000,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0,
                duration: 2000,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(particle.scale, {
                toValue: 1.5,
                duration: 1500,
                useNativeDriver: true,
              }),
              Animated.timing(particle.scale, {
                toValue: 0.5,
                duration: 1500,
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.timing(particle.translateY, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(particle.translateX, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(particle.scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    });

    Animated.stagger(300, animations).start();

    return () => {
      animations.forEach(animation => animation.stop());
    };
  }, [color]);

  return (
    <View style={styles.container}>
      {particles.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              backgroundColor: color,
              transform: [
                { translateX: particle.translateX },
                { translateY: particle.translateY },
                { scale: particle.scale },
              ],
              opacity: particle.opacity,
              left: Math.random() * 200,
              top: Math.random() * 200,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 300,
    height: 300,
    top: -150,
    left: -150,
  },
  particle: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default AnimatedParticles;
