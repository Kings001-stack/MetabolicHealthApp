export interface EducationContent {
  id: string;
  title: string;
  category: string;
  content: string;
  readTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export const diabetesContent: EducationContent[] = [
  {
    id: 'diabetes-basics',
    title: 'Understanding Diabetes',
    category: 'Diabetes',
    content: 'Diabetes is a group of metabolic disorders characterized by high blood sugar levels over a prolonged period. There are three main types: Type 1, Type 2, and gestational diabetes.',
    readTime: 5,
    difficulty: 'beginner',
    tags: ['diabetes', 'basics', 'types'],
  },
  {
    id: 'blood-sugar-monitoring',
    title: 'Blood Sugar Monitoring',
    category: 'Diabetes',
    content: 'Regular blood sugar monitoring is crucial for diabetes management. Learn when and how to test your blood glucose levels for optimal health outcomes.',
    readTime: 7,
    difficulty: 'beginner',
    tags: ['monitoring', 'blood-sugar', 'testing'],
  },
  {
    id: 'diabetes-diet',
    title: 'Diabetes-Friendly Diet',
    category: 'Diabetes',
    content: 'A balanced diet is essential for managing diabetes. Focus on complex carbohydrates, lean proteins, healthy fats, and plenty of vegetables.',
    readTime: 10,
    difficulty: 'intermediate',
    tags: ['diet', 'nutrition', 'carbohydrates'],
  },
  {
    id: 'insulin-management',
    title: 'Insulin Management',
    category: 'Diabetes',
    content: 'Understanding insulin types, timing, and dosage is crucial for Type 1 diabetes and some Type 2 diabetes patients.',
    readTime: 12,
    difficulty: 'advanced',
    tags: ['insulin', 'medication', 'dosage'],
  },
];
