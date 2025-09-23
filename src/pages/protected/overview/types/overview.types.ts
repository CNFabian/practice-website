export interface Task {
  id: string;
  title: string;
  icon: string;
  points: number;
  completed: boolean;
  isWIP?: boolean;
}

export interface Lesson {
  id: string;
  moduleNumber: number;
  title: string;
  duration?: string;
  lessonsCount?: number;
  description: string;
  points: number;
  moduleTitle: string;
  tags?: string[];
  imageUrl: string;
  status: 'continue' | 'start' | 'locked';
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  coins: number;
  rank: number;
}

export interface SupportCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  action?: () => void;
}