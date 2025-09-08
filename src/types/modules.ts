export interface Lesson {
  id: number;
  image: string;
  title: string;
  duration: string;
  description: string;
  coins: number;
  completed: boolean;
  videoUrl?: string;
  transcript?: string;
}

export interface Module {
  id: number;
  image: string;
  title: string;
  description: string;
  lessonCount: number;
  status: 'In Progress' | 'Not Started' | 'Completed';
  tags: string[];
  illustration: string;
  lessons: Lesson[];
}