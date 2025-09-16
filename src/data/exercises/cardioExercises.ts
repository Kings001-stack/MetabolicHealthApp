export interface Exercise {
  id: string;
  name: string;
  category: 'cardio' | 'strength' | 'flexibility' | 'balance';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  caloriesBurned: number; // per hour for average person
  description: string;
  instructions: string[];
  benefits: string[];
  precautions?: string[];
}

export const cardioExercises: Exercise[] = [
  {
    id: 'walking',
    name: 'Walking',
    category: 'cardio',
    difficulty: 'beginner',
    duration: 30,
    caloriesBurned: 240,
    description: 'A low-impact cardiovascular exercise suitable for all fitness levels.',
    instructions: [
      'Start with a 5-minute warm-up at a slow pace',
      'Maintain a brisk pace that allows you to talk but feel slightly breathless',
      'Keep your posture upright with arms swinging naturally',
      'Cool down with 5 minutes of slow walking',
    ],
    benefits: [
      'Improves cardiovascular health',
      'Helps with weight management',
      'Strengthens bones and muscles',
      'Improves mood and mental health',
    ],
    precautions: ['Wear proper footwear', 'Stay hydrated', 'Start slowly if new to exercise'],
  },
  {
    id: 'swimming',
    name: 'Swimming',
    category: 'cardio',
    difficulty: 'intermediate',
    duration: 30,
    caloriesBurned: 360,
    description: 'Full-body, low-impact exercise excellent for cardiovascular fitness.',
    instructions: [
      'Warm up with 5 minutes of easy swimming or water walking',
      'Alternate between different strokes (freestyle, backstroke, breaststroke)',
      'Maintain steady breathing rhythm',
      'Cool down with easy swimming or floating',
    ],
    benefits: [
      'Full-body workout',
      'Low impact on joints',
      'Builds endurance and strength',
      'Improves flexibility',
    ],
    precautions: ['Ensure pool safety', 'Know your swimming ability', 'Consider swimming lessons if needed'],
  },
  {
    id: 'cycling',
    name: 'Cycling',
    category: 'cardio',
    difficulty: 'intermediate',
    duration: 45,
    caloriesBurned: 480,
    description: 'Excellent cardiovascular exercise that can be done indoors or outdoors.',
    instructions: [
      'Adjust bike seat to proper height',
      'Start with 5-minute warm-up at easy pace',
      'Maintain steady cadence of 60-90 RPM',
      'Cool down with 5 minutes of easy pedaling',
    ],
    benefits: [
      'Builds leg strength',
      'Improves cardiovascular fitness',
      'Low impact on joints',
      'Can be social activity',
    ],
    precautions: ['Wear helmet for outdoor cycling', 'Check bike condition', 'Follow traffic rules'],
  },
];
