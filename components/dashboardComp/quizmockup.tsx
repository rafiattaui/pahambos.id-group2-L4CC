export type Quiz = {
  id: number;
  createdBy: string;
  title: string;
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
    title: 'Sample Quiz 1',
    numQuestions: 10,
    category: 'Mathematics',
  },

  {
    id: 2,
    createdBy: 'Jane Smith',
    title: 'Sample Quiz 2',
    numQuestions: 15,
    category: 'Science',
  },

  {
    id: 3,
    createdBy: 'Alice Johnson',
    title: 'Sample Quiz 3',
    numQuestions: 20,
    category: 'History',
  },

  {
    id: 4,
    createdBy: 'Bob Brown',
    title: 'Sample Quiz 4',
    numQuestions: 12,
    category: 'Geography',
  },

  {
    id: 5,
    createdBy: 'Charlie Davis',
    title: 'Sample Quiz 5',
    numQuestions: 8,
    category: 'Technology',
  },

  {
    id: 6,
    createdBy: 'Eve Wilson',
    title: 'Sample Quiz 6',
    numQuestions: 18,
    category: 'General',
  },
];
