// Structured Learning Resource Map

export interface LessonPlan {
  id: string;
  subject: string;
  topic: string;
  grade: number;
  objectives: string[];
  activities: string[];
  practiceQuestions: string[];
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const resourceMap: LessonPlan[] = [
  {
    id: 'math-1-numbers',
    subject: 'Mathematics',
    topic: 'Number Systems',
    grade: 6,
    objectives: [
      'Understand natural numbers and whole numbers',
      'Perform basic operations with large numbers',
      'Learn about number patterns',
    ],
    activities: [
      'Number line activity with physical markers',
      'Group counting exercises',
      'Pattern recognition games',
    ],
    practiceQuestions: [
      'Write the successor of 99,999',
      'Find the sum of the largest 3-digit and smallest 4-digit number',
      'Identify the pattern: 2, 6, 12, 20, ?',
    ],
    duration: '45 mins',
    difficulty: 'beginner',
  },
  {
    id: 'math-2-fractions',
    subject: 'Mathematics',
    topic: 'Fractions & Decimals',
    grade: 7,
    objectives: [
      'Convert fractions to decimals',
      'Perform operations with fractions',
      'Solve real-world fraction problems',
    ],
    activities: [
      'Pizza sharing activity (visual fractions)',
      'Fraction card matching game',
      'Measurement activities with rulers',
    ],
    practiceQuestions: [
      'Convert 3/4 to a decimal',
      'Add 1/3 + 2/5',
      'If a rope is 5/8 meter long, how much is left after cutting 1/4 meter?',
    ],
    duration: '50 mins',
    difficulty: 'intermediate',
  },
  {
    id: 'science-1-plants',
    subject: 'Science',
    topic: 'Plant Life',
    grade: 6,
    objectives: [
      'Identify parts of a plant',
      'Understand photosynthesis basics',
      'Learn about plant reproduction',
    ],
    activities: [
      'Plant observation walk',
      'Leaf collection and classification',
      'Grow a seed experiment',
    ],
    practiceQuestions: [
      'Name the process by which plants make food',
      'What are the main parts of a flower?',
      'Why are leaves green?',
    ],
    duration: '40 mins',
    difficulty: 'beginner',
  },
  {
    id: 'english-1-grammar',
    subject: 'English',
    topic: 'Parts of Speech',
    grade: 6,
    objectives: [
      'Identify nouns, verbs, adjectives',
      'Use parts of speech correctly in sentences',
      'Build vocabulary',
    ],
    activities: [
      'Word sorting game',
      'Story building with word cards',
      'Sentence correction exercises',
    ],
    practiceQuestions: [
      'Identify the noun in: "The cat sat on the mat"',
      'Give two adjectives to describe your school',
      'Change this sentence to past tense: "She runs fast"',
    ],
    duration: '40 mins',
    difficulty: 'beginner',
  },
  {
    id: 'hindi-1-vyakaran',
    subject: 'Hindi',
    topic: 'व्याकरण - संज्ञा और सर्वनाम',
    grade: 6,
    objectives: [
      'संज्ञा की पहचान करना',
      'सर्वनाम के प्रकार जानना',
      'वाक्यों में सही प्रयोग करना',
    ],
    activities: [
      'शब्द पहचान खेल',
      'कहानी लिखना',
      'वाक्य बनाना',
    ],
    practiceQuestions: [
      '"राम स्कूल जाता है" में संज्ञा शब्द बताइए',
      'सर्वनाम के तीन उदाहरण दीजिए',
      'रिक्त स्थान भरिए: ___ बहुत अच्छा लड़का है।',
    ],
    duration: '40 mins',
    difficulty: 'beginner',
  },
  {
    id: 'math-3-algebra',
    subject: 'Mathematics',
    topic: 'Introduction to Algebra',
    grade: 8,
    objectives: [
      'Understand variables and expressions',
      'Solve simple linear equations',
      'Translate word problems into equations',
    ],
    activities: [
      'Balance scale equation activity',
      'Variable mystery number game',
      'Real-life algebra applications',
    ],
    practiceQuestions: [
      'Solve: 2x + 3 = 11',
      'If a number increased by 7 is 15, what is the number?',
      'Simplify: 3a + 2b + a - b',
    ],
    duration: '50 mins',
    difficulty: 'intermediate',
  },
];

export function getResourcesBySubject(subject: string): LessonPlan[] {
  return resourceMap.filter(
    (r) => r.subject.toLowerCase() === subject.toLowerCase()
  );
}

export function getResourcesByGrade(grade: number): LessonPlan[] {
  return resourceMap.filter((r) => r.grade === grade);
}

export function getResourcesByDifficulty(
  difficulty: LessonPlan['difficulty']
): LessonPlan[] {
  return resourceMap.filter((r) => r.difficulty === difficulty);
}
