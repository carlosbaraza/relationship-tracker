"use client";

import cuid from "cuid";
import type {
  Contact,
  Interaction,
  LocalData,
  ContactWithLastInteraction,
  Reminder,
  CreateReminderData,
  ReminderType,
  RecurringUnit,
} from "./types";
import { formatTimeSince } from "./time";
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isAfter,
  isBefore,
  differenceInDays,
} from "date-fns";

const STORAGE_KEY = "elector-data";

// Initialize empty data structure
const emptyData: LocalData = {
  contacts: [],
  interactions: [],
  reminders: [],
};

export function getLocalData(): LocalData {
  if (typeof window === "undefined") return emptyData;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyData;

    const data = JSON.parse(stored);
    // Convert date strings back to Date objects
    return {
      contacts:
        data.contacts?.map((c: any) => ({
          ...c,
          createdAt: new Date(c.createdAt),
        })) || [],
      interactions:
        data.interactions?.map((i: any) => ({
          ...i,
          date: new Date(i.date),
        })) || [],
      reminders:
        data.reminders?.map((r: any) => ({
          ...r,
          dueDate: new Date(r.dueDate),
          acknowledgedAt: r.acknowledgedAt ? new Date(r.acknowledgedAt) : null,
          nextDueDate: r.nextDueDate ? new Date(r.nextDueDate) : null,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        })) || [],
    };
  } catch (error) {
    console.error("Error reading local data:", error);
    return emptyData;
  }
}

export function saveLocalData(data: LocalData): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving local data:", error);
  }
}

export function addContact(name: string, group?: string): Contact {
  const data = getLocalData();
  const contact: Contact = {
    id: cuid(),
    name: name.trim(),
    group: group?.trim() || undefined,
    createdAt: new Date(),
  };

  data.contacts.push(contact);
  saveLocalData(data);
  return contact;
}

export function updateContact(
  id: string,
  updates: Partial<Omit<Contact, "id" | "createdAt">>
): Contact | null {
  const data = getLocalData();
  const contactIndex = data.contacts.findIndex((c) => c.id === id);

  if (contactIndex === -1) return null;

  data.contacts[contactIndex] = {
    ...data.contacts[contactIndex],
    ...updates,
    name: updates.name?.trim() || data.contacts[contactIndex].name,
    group: updates.group?.trim() || data.contacts[contactIndex].group,
  };

  saveLocalData(data);
  return data.contacts[contactIndex];
}

export function deleteContact(id: string): boolean {
  const data = getLocalData();
  const contactIndex = data.contacts.findIndex((c) => c.id === id);

  if (contactIndex === -1) return false;

  // Remove contact and all its interactions and reminders
  data.contacts.splice(contactIndex, 1);
  data.interactions = data.interactions.filter((i) => i.contactId !== id);
  data.reminders = data.reminders.filter((r) => r.contactId !== id);

  saveLocalData(data);
  return true;
}

export function addInteraction(contactId: string, date?: Date, note?: string): Interaction | null {
  const data = getLocalData();
  const contact = data.contacts.find((c) => c.id === contactId);

  if (!contact) return null;

  const interaction: Interaction = {
    id: cuid(),
    contactId,
    date: date || new Date(),
    note: note?.trim() || undefined,
  };

  data.interactions.push(interaction);
  saveLocalData(data);
  return interaction;
}

export function updateInteraction(
  id: string,
  updates: Partial<Omit<Interaction, "id" | "contactId">>
): Interaction | null {
  const data = getLocalData();
  const interactionIndex = data.interactions.findIndex((i) => i.id === id);

  if (interactionIndex === -1) return null;

  data.interactions[interactionIndex] = {
    ...data.interactions[interactionIndex],
    ...updates,
    note: updates.note?.trim() || data.interactions[interactionIndex].note,
  };

  saveLocalData(data);
  return data.interactions[interactionIndex];
}

export function deleteInteraction(id: string): boolean {
  const data = getLocalData();
  const interactionIndex = data.interactions.findIndex((i) => i.id === id);

  if (interactionIndex === -1) return false;

  data.interactions.splice(interactionIndex, 1);
  saveLocalData(data);
  return true;
}

// Reminder functions
export function addReminder(reminderData: CreateReminderData): Reminder | null {
  const data = getLocalData();
  const contact = data.contacts.find((c) => c.id === reminderData.contactId);

  if (!contact) return null;

  const now = new Date();
  const reminder: Reminder = {
    id: cuid(),
    contactId: reminderData.contactId,
    title: reminderData.title.trim(),
    description: reminderData.description?.trim() || null,
    dueDate: reminderData.dueDate,
    reminderType: reminderData.reminderType,
    recurringUnit: reminderData.recurringUnit || null,
    recurringValue: reminderData.recurringValue || null,
    isAcknowledged: false,
    acknowledgedAt: null,
    nextDueDate:
      reminderData.reminderType === "RECURRING"
        ? calculateNextDueDate(
            reminderData.dueDate,
            reminderData.recurringUnit!,
            reminderData.recurringValue!
          )
        : null,
    createdAt: now,
    updatedAt: now,
  };

  data.reminders.push(reminder);
  saveLocalData(data);
  return reminder;
}

export function updateReminder(
  id: string,
  updates: Partial<Omit<Reminder, "id" | "contactId" | "createdAt">>
): Reminder | null {
  const data = getLocalData();
  const reminderIndex = data.reminders.findIndex((r) => r.id === id);

  if (reminderIndex === -1) return null;

  const currentReminder = data.reminders[reminderIndex];
  const updatedReminder = {
    ...currentReminder,
    ...updates,
    title: updates.title?.trim() || currentReminder.title,
    description: updates.description?.trim() || currentReminder.description,
    updatedAt: new Date(),
  };

  // Recalculate nextDueDate if recurring settings changed
  if (
    updatedReminder.reminderType === "RECURRING" &&
    (updates.dueDate || updates.recurringUnit || updates.recurringValue)
  ) {
    updatedReminder.nextDueDate = calculateNextDueDate(
      updatedReminder.dueDate,
      updatedReminder.recurringUnit!,
      updatedReminder.recurringValue!
    );
  }

  data.reminders[reminderIndex] = updatedReminder;
  saveLocalData(data);
  return updatedReminder;
}

export function deleteReminder(id: string): boolean {
  const data = getLocalData();
  const reminderIndex = data.reminders.findIndex((r) => r.id === id);

  if (reminderIndex === -1) return false;

  data.reminders.splice(reminderIndex, 1);
  saveLocalData(data);
  return true;
}

export function acknowledgeReminder(id: string): Reminder | null {
  const data = getLocalData();
  const reminderIndex = data.reminders.findIndex((r) => r.id === id);

  if (reminderIndex === -1) return null;

  const reminder = data.reminders[reminderIndex];
  const now = new Date();

  reminder.isAcknowledged = true;
  reminder.acknowledgedAt = now;
  reminder.updatedAt = now;

  // For recurring reminders, schedule the next occurrence
  if (reminder.reminderType === "RECURRING" && reminder.nextDueDate) {
    reminder.dueDate = reminder.nextDueDate;
    reminder.nextDueDate = calculateNextDueDate(
      reminder.dueDate,
      reminder.recurringUnit!,
      reminder.recurringValue!
    );
    reminder.isAcknowledged = false;
    reminder.acknowledgedAt = null;
  }

  saveLocalData(data);
  return reminder;
}

export function getContactReminders(contactId: string): Reminder[] {
  const data = getLocalData();
  return data.reminders
    .filter((r) => r.contactId === contactId)
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export function getAllReminders(): Reminder[] {
  const data = getLocalData();
  return data.reminders.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export function getDueReminders(): Reminder[] {
  const data = getLocalData();
  const now = new Date();

  return data.reminders
    .filter((r) => !r.isAcknowledged && isBefore(r.dueDate, now))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

export function getUpcomingReminders(withinDays: number = 30): Reminder[] {
  const data = getLocalData();
  const now = new Date();
  const cutoffDate = addDays(now, withinDays);

  return data.reminders
    .filter((r) => !r.isAcknowledged && isAfter(r.dueDate, now) && isBefore(r.dueDate, cutoffDate))
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
}

function calculateNextDueDate(currentDate: Date, unit: RecurringUnit, value: number): Date {
  switch (unit) {
    case "DAYS":
      return addDays(currentDate, value);
    case "WEEKS":
      return addWeeks(currentDate, value);
    case "MONTHS":
      return addMonths(currentDate, value);
    case "YEARS":
      return addYears(currentDate, value);
    default:
      return currentDate;
  }
}

export function getContactsWithLastInteraction(): ContactWithLastInteraction[] {
  const data = getLocalData();
  const now = new Date();

  const contactsWithInteractions = data.contacts.map((contact) => {
    const interactions = data.interactions
      .filter((i) => i.contactId === contact.id)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const reminders = data.reminders.filter((r) => r.contactId === contact.id);
    const dueReminders = reminders.filter((r) => !r.isAcknowledged && isBefore(r.dueDate, now));
    const upcomingReminders = reminders.filter(
      (r) => !r.isAcknowledged && isAfter(r.dueDate, now) && differenceInDays(r.dueDate, now) <= 30
    );

    const lastInteraction = interactions[0]?.date;

    return {
      ...contact,
      lastInteraction,
      timeSinceLastInteraction: lastInteraction ? formatTimeSince(lastInteraction) : undefined,
      dueReminders,
      upcomingReminders,
    };
  });

  // Sort by last interaction (oldest first, then by creation date for contacts without interactions)
  return contactsWithInteractions.sort((a, b) => {
    if (!a.lastInteraction && !b.lastInteraction) {
      return a.createdAt.getTime() - b.createdAt.getTime();
    }
    if (!a.lastInteraction) return -1;
    if (!b.lastInteraction) return 1;
    return a.lastInteraction.getTime() - b.lastInteraction.getTime();
  });
}

export function getContactInteractions(contactId: string): Interaction[] {
  const data = getLocalData();
  return data.interactions
    .filter((i) => i.contactId === contactId)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function clearLocalData(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
