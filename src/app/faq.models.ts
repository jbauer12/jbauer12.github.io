export type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type FaqEntryInput = {
  question: string;
  answer: string;
};
