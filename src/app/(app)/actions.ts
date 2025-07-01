"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { formatTimeSince } from "@/lib/time";
import {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isAfter,
  isBefore,
  differenceInDays,
} from "date-fns";
import cuid from "cuid";
import type { CreateReminderData, Reminder, ReminderType, RecurringUnit } from "@/lib/types";

export async function getContacts() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const contacts = await db.contact.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      interactions: {
        orderBy: {
          date: "desc",
        },
        take: 1,
      },
      reminders: {
        where: {
          isAcknowledged: false,
        },
        orderBy: {
          dueDate: "asc",
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const now = new Date();

  return contacts
    .map((contact: any) => {
      const dueReminders = contact.reminders.filter((r: any) => isBefore(r.dueDate, now));
      const upcomingReminders = contact.reminders.filter(
        (r: any) => isAfter(r.dueDate, now) && differenceInDays(r.dueDate, now) <= 30
      );

      return {
        ...contact,
        lastInteraction: contact.interactions[0]?.date,
        timeSinceLastInteraction: contact.interactions[0]?.date
          ? formatTimeSince(contact.interactions[0].date)
          : undefined,
        dueReminders,
        upcomingReminders,
      };
    })
    .sort((a: any, b: any) => {
      // Sort by last interaction (oldest first, then by creation date for contacts without interactions)
      if (!a.lastInteraction && !b.lastInteraction) {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }
      if (!a.lastInteraction) return -1;
      if (!b.lastInteraction) return 1;
      return a.lastInteraction.getTime() - b.lastInteraction.getTime();
    });
}

export async function addContact(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const name = formData.get("name") as string;
  const group = formData.get("group") as string;

  if (!name?.trim()) {
    throw new Error("Name is required");
  }

  const contact = await db.contact.create({
    data: {
      id: cuid(),
      name: name.trim(),
      group: group?.trim() || null,
      userId: session.user.id,
    },
  });

  revalidatePath("/");
  return contact;
}

export async function deleteContact(contactId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify contact belongs to user
  const contact = await db.contact.findFirst({
    where: {
      id: contactId,
      userId: session.user.id,
    },
  });

  if (!contact) {
    throw new Error("Contact not found");
  }

  // Delete contact and all interactions and reminders (cascade should handle this)
  await db.contact.delete({
    where: {
      id: contactId,
    },
  });

  revalidatePath("/");
}

export async function addInteraction(contactId: string, date?: Date, note?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify contact belongs to user
  const contact = await db.contact.findFirst({
    where: {
      id: contactId,
      userId: session.user.id,
    },
  });

  if (!contact) {
    throw new Error("Contact not found");
  }

  const interaction = await db.interaction.create({
    data: {
      id: cuid(),
      contactId,
      date: date || new Date(),
      note: note?.trim() || null,
    },
  });

  revalidatePath("/");
  revalidatePath(`/contacts/${contactId}`);
  return interaction;
}

export async function getContact(contactId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const contact = await db.contact.findFirst({
    where: {
      id: contactId,
      userId: session.user.id,
    },
  });

  return contact;
}

export async function getContactInteractions(contactId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  // Verify contact belongs to user
  const contact = await db.contact.findFirst({
    where: {
      id: contactId,
      userId: session.user.id,
    },
  });

  if (!contact) {
    return [];
  }

  const interactions = await db.interaction.findMany({
    where: {
      contactId,
    },
    orderBy: {
      date: "desc",
    },
  });

  return interactions;
}

export async function updateInteraction(
  interactionId: string,
  updates: { date?: Date; note?: string | null }
) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify interaction belongs to user
  const interaction = await db.interaction.findFirst({
    where: {
      id: interactionId,
    },
    include: {
      contact: true,
    },
  });

  if (!interaction || interaction.contact.userId !== session.user.id) {
    throw new Error("Interaction not found");
  }

  const updatedInteraction = await db.interaction.update({
    where: {
      id: interactionId,
    },
    data: {
      date: updates.date || interaction.date,
      note: updates.note?.trim() || null,
    },
  });

  revalidatePath("/");
  revalidatePath(`/contacts/${interaction.contactId}`);
  return updatedInteraction;
}

export async function deleteInteraction(interactionId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify interaction belongs to user
  const interaction = await db.interaction.findFirst({
    where: {
      id: interactionId,
    },
    include: {
      contact: true,
    },
  });

  if (!interaction || interaction.contact.userId !== session.user.id) {
    throw new Error("Interaction not found");
  }

  await db.interaction.delete({
    where: {
      id: interactionId,
    },
  });

  revalidatePath("/");
  revalidatePath(`/contacts/${interaction.contactId}`);
}

// Reminder actions
export async function addReminder(reminderData: CreateReminderData): Promise<Reminder> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify contact belongs to user
  const contact = await db.contact.findFirst({
    where: {
      id: reminderData.contactId,
      userId: session.user.id,
    },
  });

  if (!contact) {
    throw new Error("Contact not found");
  }

  const now = new Date();
  const reminder = await db.reminder.create({
    data: {
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
        reminderData.reminderType === "RECURRING" &&
        reminderData.recurringUnit &&
        reminderData.recurringValue
          ? calculateNextDueDate(
              reminderData.dueDate,
              reminderData.recurringUnit,
              reminderData.recurringValue
            )
          : null,
      createdAt: now,
      updatedAt: now,
    },
  });

  revalidatePath("/");
  revalidatePath(`/contacts/${reminderData.contactId}`);
  return reminder as Reminder;
}

export async function updateReminder(
  reminderId: string,
  updates: Partial<Omit<Reminder, "id" | "contactId" | "createdAt">>
): Promise<Reminder | null> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify reminder belongs to user
  const reminder = await db.reminder.findFirst({
    where: {
      id: reminderId,
    },
    include: {
      contact: true,
    },
  });

  if (!reminder || reminder.contact.userId !== session.user.id) {
    throw new Error("Reminder not found");
  }

  const updateData: any = {
    ...updates,
    updatedAt: new Date(),
  };

  if (updates.title) {
    updateData.title = updates.title.trim();
  }
  if (updates.description !== undefined) {
    updateData.description = updates.description?.trim() || null;
  }

  // Recalculate nextDueDate if recurring settings changed
  if (
    updateData.reminderType === "RECURRING" &&
    (updates.dueDate || updates.recurringUnit || updates.recurringValue)
  ) {
    const newDueDate = updates.dueDate || reminder.dueDate;
    const newUnit = updates.recurringUnit || reminder.recurringUnit;
    const newValue = updates.recurringValue || reminder.recurringValue;

    if (newUnit && newValue) {
      updateData.nextDueDate = calculateNextDueDate(newDueDate, newUnit, newValue);
    }
  }

  const updatedReminder = await db.reminder.update({
    where: {
      id: reminderId,
    },
    data: updateData,
  });

  revalidatePath("/");
  revalidatePath(`/contacts/${reminder.contactId}`);
  return updatedReminder as Reminder;
}

export async function deleteReminder(reminderId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify reminder belongs to user
  const reminder = await db.reminder.findFirst({
    where: {
      id: reminderId,
    },
    include: {
      contact: true,
    },
  });

  if (!reminder || reminder.contact.userId !== session.user.id) {
    throw new Error("Reminder not found");
  }

  await db.reminder.delete({
    where: {
      id: reminderId,
    },
  });

  revalidatePath("/");
  revalidatePath(`/contacts/${reminder.contactId}`);
}

export async function acknowledgeReminder(reminderId: string): Promise<Reminder | null> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Verify reminder belongs to user
  const reminder = await db.reminder.findFirst({
    where: {
      id: reminderId,
    },
    include: {
      contact: true,
    },
  });

  if (!reminder || reminder.contact.userId !== session.user.id) {
    throw new Error("Reminder not found");
  }

  const now = new Date();
  let updateData: any = {
    isAcknowledged: true,
    acknowledgedAt: now,
    updatedAt: now,
  };

  // For recurring reminders, schedule the next occurrence
  if (reminder.reminderType === "RECURRING" && reminder.nextDueDate) {
    updateData = {
      dueDate: reminder.nextDueDate,
      nextDueDate:
        reminder.recurringUnit && reminder.recurringValue
          ? calculateNextDueDate(
              reminder.nextDueDate,
              reminder.recurringUnit,
              reminder.recurringValue
            )
          : null,
      isAcknowledged: false,
      acknowledgedAt: null,
      updatedAt: now,
    };
  }

  const updatedReminder = await db.reminder.update({
    where: {
      id: reminderId,
    },
    data: updateData,
  });

  revalidatePath("/");
  revalidatePath(`/contacts/${reminder.contactId}`);
  return updatedReminder as Reminder;
}

export async function getContactReminders(contactId: string): Promise<Reminder[]> {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  // Verify contact belongs to user
  const contact = await db.contact.findFirst({
    where: {
      id: contactId,
      userId: session.user.id,
    },
  });

  if (!contact) {
    return [];
  }

  const reminders = await db.reminder.findMany({
    where: {
      contactId,
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  return reminders as Reminder[];
}

export async function getAllReminders(): Promise<Reminder[]> {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const reminders = await db.reminder.findMany({
    where: {
      contact: {
        userId: session.user.id,
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  return reminders as Reminder[];
}

export async function getDueReminders(): Promise<Reminder[]> {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const now = new Date();
  const reminders = await db.reminder.findMany({
    where: {
      contact: {
        userId: session.user.id,
      },
      isAcknowledged: false,
      dueDate: {
        lt: now,
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  return reminders as Reminder[];
}

export async function getUpcomingReminders(withinDays: number = 30): Promise<Reminder[]> {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  const now = new Date();
  const cutoffDate = addDays(now, withinDays);

  const reminders = await db.reminder.findMany({
    where: {
      contact: {
        userId: session.user.id,
      },
      isAcknowledged: false,
      dueDate: {
        gt: now,
        lt: cutoffDate,
      },
    },
    orderBy: {
      dueDate: "asc",
    },
  });

  return reminders as Reminder[];
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

export async function migrateLocalData(localData: {
  contacts: Array<{
    id: string;
    name: string;
    group?: string | null;
    createdAt: Date;
  }>;
  interactions: Array<{
    id: string;
    contactId: string;
    date: Date;
    note?: string | null;
  }>;
  reminders: Array<{
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
  }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Create contacts first
  const contactMapping: Record<string, string> = {};
  for (const localContact of localData.contacts) {
    const newContact = await db.contact.create({
      data: {
        id: cuid(),
        name: localContact.name,
        group: localContact.group || null,
        userId: session.user.id,
        createdAt: localContact.createdAt,
      },
    });
    contactMapping[localContact.id] = newContact.id;
  }

  // Create interactions with new contact IDs
  for (const localInteraction of localData.interactions) {
    const newContactId = contactMapping[localInteraction.contactId];
    if (newContactId) {
      await db.interaction.create({
        data: {
          id: cuid(),
          contactId: newContactId,
          date: localInteraction.date,
          note: localInteraction.note || null,
        },
      });
    }
  }

  // Create reminders with new contact IDs
  for (const localReminder of localData.reminders) {
    const newContactId = contactMapping[localReminder.contactId];
    if (newContactId) {
      await db.reminder.create({
        data: {
          id: cuid(),
          contactId: newContactId,
          title: localReminder.title,
          description: localReminder.description || null,
          dueDate: localReminder.dueDate,
          reminderType: localReminder.reminderType,
          recurringUnit: localReminder.recurringUnit || null,
          recurringValue: localReminder.recurringValue || null,
          isAcknowledged: localReminder.isAcknowledged,
          acknowledgedAt: localReminder.acknowledgedAt || null,
          nextDueDate: localReminder.nextDueDate || null,
          createdAt: localReminder.createdAt,
          updatedAt: localReminder.updatedAt,
        },
      });
    }
  }

  revalidatePath("/");
}
