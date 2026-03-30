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
  {
    id: 'physics-1-motion',
    subject: 'Physics',
    topic: 'Force and Motion Basics',
    grade: 9,
    objectives: [
      'Understand distance, displacement, speed, and velocity',
      'Explain the effect of force on motion',
      'Solve basic motion word problems',
    ],
    activities: [
      'Toy car ramp experiment',
      'Speed-time observation activity',
      'Group discussion on daily-life motion examples',
    ],
    practiceQuestions: [
      'Differentiate between speed and velocity with one example each',
      'What happens to motion when friction increases?',
      'A bike covers 120 km in 3 hours. Find the average speed.',
    ],
    duration: '45 mins',
    difficulty: 'intermediate',
  },
  {
    id: 'physics-2-energy',
    subject: 'Physics',
    topic: 'Work, Energy and Power',
    grade: 9,
    objectives: [
      'Define work, energy, and power with units',
      'Differentiate potential and kinetic energy',
      'Apply basic formulas to solve numericals',
    ],
    activities: [
      'Lifting object experiment to explain work',
      'Pendulum observation for energy conversion',
      'Power calculation race in teams',
    ],
    practiceQuestions: [
      'A force of 10 N moves an object 5 m. Calculate work done.',
      'Give one real-life example of potential to kinetic energy conversion.',
      'A machine does 300 J work in 10 s. Find power.',
    ],
    duration: '45 mins',
    difficulty: 'intermediate',
  },
  {
    id: 'physics-3-electricity',
    subject: 'Physics',
    topic: 'Current Electricity',
    grade: 10,
    objectives: [
      'Understand electric current, voltage, and resistance',
      'Use Ohm’s law in simple circuit problems',
      'Differentiate series and parallel circuits',
    ],
    activities: [
      'Battery-bulb circuit building',
      'Series vs parallel brightness comparison',
      'Resistance puzzle using simple values',
    ],
    practiceQuestions: [
      'State Ohm’s law',
      'Find current when V = 12V and R = 4Ω',
      'Why are household appliances connected in parallel?',
    ],
    duration: '50 mins',
    difficulty: 'advanced',
  },
  {
    id: 'chem-1-atoms',
    subject: 'Chemistry',
    topic: 'Atoms, Molecules and Chemical Reactions',
    grade: 9,
    objectives: [
      'Understand atoms and molecules',
      'Classify physical and chemical changes',
      'Write and balance simple chemical equations',
    ],
    activities: [
      'Model building with colored beads',
      'Vinegar and baking soda reaction demo',
      'Equation balancing card game',
    ],
    practiceQuestions: [
      'Define atom and molecule',
      'State whether rusting is physical or chemical change and why',
      'Balance: H2 + O2 -> H2O',
    ],
    duration: '45 mins',
    difficulty: 'intermediate',
  },
  {
    id: 'chem-2-acids-bases',
    subject: 'Chemistry',
    topic: 'Acids, Bases and Salts',
    grade: 10,
    objectives: [
      'Identify acidic and basic substances',
      'Use indicators to test pH nature',
      'Understand neutralization reaction',
    ],
    activities: [
      'Litmus test with common liquids',
      'pH scale color chart matching',
      'Neutralization demonstration',
    ],
    practiceQuestions: [
      'Name two acids and two bases used in daily life.',
      'What color does red litmus turn in a base?',
      'Write one example of a neutralization reaction.',
    ],
    duration: '45 mins',
    difficulty: 'intermediate',
  },
  {
    id: 'chem-3-periodic-table',
    subject: 'Chemistry',
    topic: 'Periodic Table and Element Properties',
    grade: 10,
    objectives: [
      'Understand grouping in the periodic table',
      'Relate valency with group position',
      'Compare metals and non-metals',
    ],
    activities: [
      'Periodic table scavenger hunt',
      'Element card sorting by group',
      'Metal vs non-metal property demo',
    ],
    practiceQuestions: [
      'Why are elements in the same group chemically similar?',
      'Give two properties of metals and non-metals each.',
      'Find the valency trend across a period (basic).',
    ],
    duration: '50 mins',
    difficulty: 'advanced',
  },
  {
    id: 'bio-1-cells',
    subject: 'Biology',
    topic: 'Cell Structure and Functions',
    grade: 8,
    objectives: [
      'Identify major parts of plant and animal cells',
      'Explain the function of nucleus, membrane, and cytoplasm',
      'Compare plant and animal cells',
    ],
    activities: [
      'Draw-and-label cell activity',
      'Microscope image observation',
      'Cell organelle role-play in groups',
    ],
    practiceQuestions: [
      'Why is the nucleus called the control center of the cell?',
      'Mention two differences between plant and animal cells',
      'Name three organelles and one function of each',
    ],
    duration: '40 mins',
    difficulty: 'beginner',
  },
  {
    id: 'bio-2-digestion',
    subject: 'Biology',
    topic: 'Human Digestive System',
    grade: 8,
    objectives: [
      'Identify major organs in the digestive system',
      'Explain the process from ingestion to absorption',
      'Connect nutrition habits with digestive health',
    ],
    activities: [
      'Digestive system labeling exercise',
      'Food journey role-play',
      'Healthy meal plate planning',
    ],
    practiceQuestions: [
      'What is the function of small intestine?',
      'Differentiate digestion and absorption.',
      'Why is fiber important in food?',
    ],
    duration: '40 mins',
    difficulty: 'beginner',
  },
  {
    id: 'bio-3-heredity',
    subject: 'Biology',
    topic: 'Heredity and Evolution Basics',
    grade: 10,
    objectives: [
      'Understand inherited and acquired traits',
      'Learn basic terms: gene, chromosome, variation',
      'Explain why variation helps survival',
    ],
    activities: [
      'Family trait observation worksheet',
      'Trait probability card activity',
      'Evolution story discussion',
    ],
    practiceQuestions: [
      'What is the difference between inherited and acquired traits?',
      'Define variation with one example.',
      'Why are variations useful to species?',
    ],
    duration: '50 mins',
    difficulty: 'advanced',
  },
  {
    id: 'commerce-1-budgeting',
    subject: 'Commerce',
    topic: 'Personal Finance and Budgeting',
    grade: 9,
    objectives: [
      'Understand income, expense, saving, and budgeting concepts',
      'Create a simple weekly and monthly budget',
      'Learn basic responsible spending habits',
    ],
    activities: [
      'Household budget worksheet',
      'Needs vs wants classification game',
      'Savings goal planning activity',
    ],
    practiceQuestions: [
      'Differentiate between fixed and variable expenses',
      'Create a sample budget for a student with pocket money of 1000 per month',
      'Why is saving important for emergencies?',
    ],
    duration: '45 mins',
    difficulty: 'beginner',
  },
  {
    id: 'commerce-2-banking',
    subject: 'Commerce',
    topic: 'Banking Basics and Digital Payments',
    grade: 9,
    objectives: [
      'Understand savings/current accounts',
      'Learn safe usage of UPI and digital payments',
      'Read a basic bank statement',
    ],
    activities: [
      'Mock bank form filling',
      'UPI safety scenario discussion',
      'Statement decoding activity',
    ],
    practiceQuestions: [
      'What is the difference between a savings and current account?',
      'List two precautions for safe digital payments.',
      'What details are shown in a bank statement?',
    ],
    duration: '45 mins',
    difficulty: 'intermediate',
  },
  {
    id: 'commerce-3-profit-loss',
    subject: 'Commerce',
    topic: 'Profit, Loss and Simple Interest',
    grade: 10,
    objectives: [
      'Calculate profit and loss in simple cases',
      'Understand cost price and selling price',
      'Compute simple interest for basic scenarios',
    ],
    activities: [
      'Mini market simulation',
      'Price tag challenge',
      'Interest calculator worksheet',
    ],
    practiceQuestions: [
      'If CP = 200 and SP = 250, find profit and profit percent.',
      'If CP = 500 and SP = 450, find loss percent.',
      'Find simple interest on 1000 at 5% for 2 years.',
    ],
    duration: '50 mins',
    difficulty: 'advanced',
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
