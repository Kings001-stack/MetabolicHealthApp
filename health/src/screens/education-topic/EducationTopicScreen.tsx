
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';

const EducationTopicScreen = () => {
  const route = useRoute();
  const { topic } = route.params;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>{topic.title}</Text>
        <Text style={styles.summary}>{topic.summary}</Text>
        <View style={styles.content}>
          <Text>Here will be the content of the article.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  summary: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  content: {
    marginTop: 20,
  },
});

export default EducationTopicScreen;
