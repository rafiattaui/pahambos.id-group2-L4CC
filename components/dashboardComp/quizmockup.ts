export type Quiz = {
  id: string;
  createdBy: string;
  title: string;
  description: string;
  imageUrl?: string;
  numQuestions: number;
  createdAt: string;
  creatorName?: string;
  category:
    | 'Mathematics'
    | 'Science'
    | 'History'
    | 'Geography'
    | 'Technology'
    | 'General';
};
