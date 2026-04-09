export type Quiz = {
  id: number;
  createdBy: string;
  title: string;
  description: string;
  numQuestions: number;
  category:
    | 'Mathematics'
    | 'Science'
    | 'History'
    | 'Geography'
    | 'Technology'
    | 'General';
};

export const mockQuizzes: Quiz[] = [
  {
    id: 1,
    createdBy: 'John Doe',
    title: 'Algebra Basics Challenge',
    description:
      'Practice core algebra concepts including equations and variables.',
    numQuestions: 10,
    category: 'Mathematics',
  },

  {
    id: 2,
    createdBy: 'Liam Carter',
    title: 'Geometry and Angles',
    description:
      'Test your understanding of shapes, angles, and geometric rules.',
    numQuestions: 14,
    category: 'Mathematics',
  },

  {
    id: 3,
    createdBy: 'Maya Lee',
    title: 'Fractions and Decimals',
    description:
      'Solve fraction and decimal problems from basic to intermediate.',
    numQuestions: 12,
    category: 'Mathematics',
  },

  {
    id: 4,
    createdBy: 'Noah Patel',
    title: 'Trigonometry Sprint',
    description: 'Challenge yourself with sine, cosine, and tangent questions.',
    numQuestions: 16,
    category: 'Mathematics',
  },

  {
    id: 5,
    createdBy: 'Olivia Chen',
    title: 'Statistics Essentials',
    description: 'Explore mean, median, mode, and basic data interpretation.',
    numQuestions: 13,
    category: 'Mathematics',
  },

  {
    id: 6,
    createdBy: 'Ethan Kim',
    title: 'Calculus Quick Check',
    description: 'Review limits, derivatives, and introductory calculus ideas.',
    numQuestions: 15,
    category: 'Mathematics',
  },

  {
    id: 7,
    createdBy: 'Jane Smith',
    title: 'Introduction to Physics',
    description: 'Learn the basics of motion, force, and energy in physics.',
    numQuestions: 15,
    category: 'Science',
  },

  {
    id: 8,
    createdBy: 'Sophia Nguyen',
    title: 'Chemistry Elements Quiz',
    description: 'Identify key chemical elements and their common properties.',
    numQuestions: 16,
    category: 'Science',
  },

  {
    id: 9,
    createdBy: 'Lucas Wright',
    title: 'Biology Cell Explorer',
    description:
      'Discover cell structures, functions, and biological processes.',
    numQuestions: 14,
    category: 'Science',
  },

  {
    id: 10,
    createdBy: 'Emma Rivera',
    title: 'Forces and Motion',
    description: 'Understand how forces affect movement and acceleration.',
    numQuestions: 11,
    category: 'Science',
  },

  {
    id: 11,
    createdBy: 'Henry Adams',
    title: 'Earth Science Review',
    description: 'Cover rocks, weather, and processes shaping Earth.',
    numQuestions: 13,
    category: 'Science',
  },

  {
    id: 12,
    createdBy: 'Ava Thompson',
    title: 'Astronomy Basics',
    description: 'Test your knowledge of planets, stars, and space facts.',
    numQuestions: 12,
    category: 'Science',
  },

  {
    id: 13,
    createdBy: 'Alice Johnson',
    title: 'World War II Timeline',
    description: 'Follow major events and turning points of World War II.',
    numQuestions: 20,
    category: 'History',
  },

  {
    id: 14,
    createdBy: 'James Foster',
    title: 'Ancient Civilizations Review',
    description: 'Explore cultures and achievements of early civilizations.',
    numQuestions: 11,
    category: 'History',
  },

  {
    id: 15,
    createdBy: 'Chloe Martin',
    title: 'Independence Movements',
    description: 'Learn about global independence struggles and outcomes.',
    numQuestions: 13,
    category: 'History',
  },

  {
    id: 16,
    createdBy: 'Daniel Scott',
    title: 'Medieval Europe Quiz',
    description: 'Review feudalism, kingdoms, and medieval life in Europe.',
    numQuestions: 14,
    category: 'History',
  },

  {
    id: 17,
    createdBy: 'Grace Kim',
    title: 'Asian Dynasties Spotlight',
    description: 'Test key facts about influential Asian dynasties.',
    numQuestions: 12,
    category: 'History',
  },

  {
    id: 18,
    createdBy: 'Benjamin Ross',
    title: 'Colonial Era Facts',
    description: 'Understand major events and impacts of colonial periods.',
    numQuestions: 10,
    category: 'History',
  },

  {
    id: 19,
    createdBy: 'Bob Brown',
    title: 'Capitals and Continents',
    description: 'Match countries with capitals and identify continents.',
    numQuestions: 12,
    category: 'Geography',
  },

  {
    id: 20,
    createdBy: 'Mia Rodriguez',
    title: 'Rivers and Mountains',
    description: 'Recognize major rivers and mountain ranges worldwide.',
    numQuestions: 13,
    category: 'Geography',
  },

  {
    id: 21,
    createdBy: 'Nora Bell',
    title: 'Climate Zones Challenge',
    description: 'Identify climate zones and their unique characteristics.',
    numQuestions: 11,
    category: 'Geography',
  },

  {
    id: 22,
    createdBy: 'Caleb Moore',
    title: 'World Maps Mastery',
    description: 'Sharpen map reading skills and global location knowledge.',
    numQuestions: 14,
    category: 'Geography',
  },

  {
    id: 23,
    createdBy: 'Zoe Turner',
    title: 'Oceans and Seas',
    description: 'Test what you know about oceans, seas, and marine regions.',
    numQuestions: 9,
    category: 'Geography',
  },

  {
    id: 24,
    createdBy: 'Isaac Hall',
    title: 'Countries and Flags',
    description: 'Identify flags and connect them to the right countries.',
    numQuestions: 15,
    category: 'Geography',
  },

  {
    id: 25,
    createdBy: 'Charlie Davis',
    title: 'Modern Tech Essentials',
    description: 'Cover important concepts in modern consumer technology.',
    numQuestions: 8,
    category: 'Technology',
  },

  {
    id: 26,
    createdBy: 'Levi Cooper',
    title: 'Cybersecurity Fundamentals',
    description: 'Learn key ideas for online safety and data protection.',
    numQuestions: 9,
    category: 'Technology',
  },

  {
    id: 27,
    createdBy: 'Hannah Brooks',
    title: 'AI and Machine Learning',
    description: 'Understand basic AI terms and machine learning concepts.',
    numQuestions: 12,
    category: 'Technology',
  },

  {
    id: 28,
    createdBy: 'Owen Price',
    title: 'Web Development Basics',
    description: 'Test fundamentals of HTML, CSS, and web development flow.',
    numQuestions: 14,
    category: 'Technology',
  },

  {
    id: 29,
    createdBy: 'Ella Simmons',
    title: 'Computer Hardware Check',
    description: 'Review core computer parts and how they work together.',
    numQuestions: 10,
    category: 'Technology',
  },

  {
    id: 30,
    createdBy: 'Wyatt Reed',
    title: 'Networking Essentials',
    description:
      'Learn networking basics including routers, IP, and protocols.',
    numQuestions: 13,
    category: 'Technology',
  },

  {
    id: 31,
    createdBy: 'Eve Wilson',
    title: 'Daily Trivia Mix',
    description: 'A mixed quiz with random fun facts from many topics.',
    numQuestions: 18,
    category: 'General',
  },

  {
    id: 32,
    createdBy: 'Ava Thompson',
    title: 'Fun Facts Lightning Round',
    description:
      'Quick-fire general knowledge questions to test your reflexes.',
    numQuestions: 17,
    category: 'General',
  },

  {
    id: 33,
    createdBy: 'Mason Gray',
    title: 'Pop Culture Quickfire',
    description:
      'Challenge yourself with trends, media, and pop culture trivia.',
    numQuestions: 12,
    category: 'General',
  },

  {
    id: 34,
    createdBy: 'Lily Ward',
    title: 'Everyday Knowledge Test',
    description: 'Check your practical knowledge about everyday topics.',
    numQuestions: 11,
    category: 'General',
  },

  {
    id: 35,
    createdBy: 'Jack Collins',
    title: 'Mixed Trivia Challenge',
    description: 'A balanced set of random questions across multiple themes.',
    numQuestions: 14,
    category: 'General',
  },

  {
    id: 36,
    createdBy: 'Aria Bennett',
    title: 'Brain Teasers and Facts',
    description: 'Solve fun brain teasers paired with interesting trivia.',
    numQuestions: 10,
    category: 'General',
  },
];
