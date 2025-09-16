import { EducationContent } from './diabetesContent';

export const hypertensionContent: EducationContent[] = [
  {
    id: 'hypertension-basics',
    title: 'Understanding High Blood Pressure',
    category: 'Hypertension',
    content: 'Hypertension, or high blood pressure, is a condition where blood pressure in the arteries is persistently elevated. It is often called the "silent killer" because it typically has no symptoms.',
    readTime: 6,
    difficulty: 'beginner',
    tags: ['hypertension', 'blood-pressure', 'basics'],
  },
  {
    id: 'bp-categories',
    title: 'Blood Pressure Categories',
    category: 'Hypertension',
    content: 'Normal: Less than 120/80 mmHg. Elevated: 120-129/<80 mmHg. Stage 1: 130-139/80-89 mmHg. Stage 2: 140/90 mmHg or higher.',
    readTime: 4,
    difficulty: 'beginner',
    tags: ['categories', 'ranges', 'classification'],
  },
  {
    id: 'lifestyle-changes',
    title: 'Lifestyle Changes for Blood Pressure',
    category: 'Hypertension',
    content: 'Regular exercise, healthy diet (DASH diet), limiting sodium, maintaining healthy weight, limiting alcohol, and managing stress can significantly reduce blood pressure.',
    readTime: 8,
    difficulty: 'intermediate',
    tags: ['lifestyle', 'diet', 'exercise', 'stress'],
  },
  {
    id: 'medication-adherence',
    title: 'Blood Pressure Medications',
    category: 'Hypertension',
    content: 'Common BP medications include ACE inhibitors, ARBs, diuretics, and calcium channel blockers. Taking medications as prescribed is crucial for control.',
    readTime: 10,
    difficulty: 'advanced',
    tags: ['medications', 'adherence', 'treatment'],
  },
];
