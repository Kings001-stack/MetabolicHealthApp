import { EducationContent } from './diabetesContent';

export const obesityContent: EducationContent[] = [
  {
    id: 'obesity-basics',
    title: 'Understanding Obesity',
    category: 'Obesity',
    content: 'Obesity is a complex disease involving excessive body fat that increases the risk of health problems. BMI over 30 is classified as obese.',
    readTime: 5,
    difficulty: 'beginner',
    tags: ['obesity', 'BMI', 'basics'],
  },
  {
    id: 'bmi-calculation',
    title: 'BMI and Body Composition',
    category: 'Obesity',
    content: 'BMI is calculated as weight (kg) divided by height squared (m²). Underweight: <18.5, Normal: 18.5-24.9, Overweight: 25-29.9, Obese: ≥30.',
    readTime: 4,
    difficulty: 'beginner',
    tags: ['BMI', 'calculation', 'categories'],
  },
  {
    id: 'weight-management',
    title: 'Sustainable Weight Management',
    category: 'Obesity',
    content: 'Effective weight management combines caloric deficit through diet and exercise, behavioral changes, and long-term lifestyle modifications.',
    readTime: 9,
    difficulty: 'intermediate',
    tags: ['weight-loss', 'diet', 'exercise', 'behavior'],
  },
  {
    id: 'metabolic-health',
    title: 'Obesity and Metabolic Health',
    category: 'Obesity',
    content: 'Obesity increases risk of type 2 diabetes, cardiovascular disease, sleep apnea, and certain cancers. Even modest weight loss can improve health outcomes.',
    readTime: 7,
    difficulty: 'intermediate',
    tags: ['metabolic', 'complications', 'health-risks'],
  },
];
