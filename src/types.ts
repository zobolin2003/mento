export interface Reminder {
  id: string;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  deadline?: string;
  note?: string;
  time?: string;
  repeat?: string;
  repeatDates?: string[];
}
