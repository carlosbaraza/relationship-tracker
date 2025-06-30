"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { formatTimeSince } from "@/lib/time";
import cuid from "cuid";

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
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return contacts
    .map((contact: any) => ({
      ...contact,
      lastInteraction: contact.interactions[0]?.date,
      timeSinceLastInteraction: contact.interactions[0]?.date
        ? formatTimeSince(contact.interactions[0].date)
        : undefined,
    }))
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

  // Delete contact and all interactions (cascade should handle this)
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

  revalidatePath("/");
}
