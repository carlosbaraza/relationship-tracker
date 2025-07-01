export interface Contact {
  id: string;
  name: string;
  group?: string | null;
  createdAt: Date;
}

export interface Interaction {
  id: string;
  contactId: string;
  date: Date;
  note?: string | null;
}

export interface Reminder {
  id: string;
  contactId: string;
  title: string;
  description?: string | null;
  dueDate: Date;
  reminderType: ReminderType;
  recurringUnit?: RecurringUnit | null;
  recurringValue?: number | null;
  isAcknowledged: boolean;
  acknowledgedAt?: Date | null;
  nextDueDate?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ReminderType = "ONE_TIME" | "RECURRING";
export type RecurringUnit = "DAYS" | "WEEKS" | "MONTHS" | "YEARS";

export interface LocalData {
  contacts: Contact[];
  interactions: Interaction[];
  reminders: Reminder[];
}

export interface ContactWithLastInteraction extends Contact {
  lastInteraction?: Date;
  timeSinceLastInteraction?: string;
  upcomingReminders?: Reminder[];
  dueReminders?: Reminder[];
}

// Database types
export interface DbContact {
  id: string;
  name: string;
  group: string | null;
  userId: string;
  createdAt: Date;
  interactions: DbInteraction[];
  reminders?: DbReminder[];
}

export interface DbInteraction {
  id: string;
  contactId: string;
  date: Date;
  note: string | null;
}

export interface DbReminder {
  id: string;
  contactId: string;
  title: string;
  description: string | null;
  dueDate: Date;
  reminderType: ReminderType;
  recurringUnit: RecurringUnit | null;
  recurringValue: number | null;
  isAcknowledged: boolean;
  acknowledgedAt: Date | null;
  nextDueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Reminder display types
export interface ReminderWithContact extends Reminder {
  contact: Contact;
}

export interface CreateReminderData {
  contactId: string;
  title: string;
  description?: string;
  dueDate: Date;
  reminderType: ReminderType;
  recurringUnit?: RecurringUnit;
  recurringValue?: number;
}
