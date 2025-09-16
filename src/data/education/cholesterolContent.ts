import { EducationContent } from './diabetesContent';

export const cholesterolContent: EducationContent[] = [
  {
    id: 'cholesterol-basics',
    title: 'Understanding Cholesterol',
    category: 'Cholesterol',
    content: 'Cholesterol is a waxy substance found in blood. Your body needs cholesterol, but too much can increase heart disease risk. There are two main types: LDL (bad) and HDL (good).',
    readTime: 6,
    difficulty: 'beginner',
    tags: ['cholesterol', 'LDL', 'HDL', 'basics'],
  },
  {
    id: 'cholesterol-levels',
    title: 'Cholesterol Level Guidelines',
    category: 'Cholesterol',
    content: 'Total cholesterol: <200 mg/dL desirable. LDL: <100 mg/dL optimal. HDL: ≥40 mg/dL (men), ≥50 mg/dL (women). Triglycerides: <150 mg/dL.',
    readTime: 4,
    difficulty: 'beginner',
    tags: ['levels', 'guidelines', 'targets'],
  },
  {
    id: 'heart-healthy-diet',
    title: 'Heart-Healthy Diet for Cholesterol',
    category: 'Cholesterol',
    content: 'Focus on foods high in soluble fiber, omega-3 fatty acids, and plant sterols. Limit saturated fats, trans fats, and dietary cholesterol.',
    readTime: 8,
    difficulty: 'intermediate',
    tags: ['diet', 'heart-healthy', 'fiber', 'omega-3'],
  },
  {
    id: 'statin-therapy',
    title: 'Cholesterol Medications',
    category: 'Cholesterol',
    content: 'Statins are the most common cholesterol-lowering medications. Other options include bile acid sequestrants, cholesterol absorption inhibitors, and PCSK9 inhibitors.',
    readTime: 10,
    difficulty: 'advanced',
    tags: ['statins', 'medications', 'treatment'],
  },
];
