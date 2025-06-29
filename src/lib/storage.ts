"use client";

import cuid from "cuid";
import type { Contact, Interaction, LocalData, ContactWithLastInteraction } from "./types";
import { formatTimeSince } from "./time";

const STORAGE_KEY = "elector-data";

// Initialize empty data structure
const emptyData: LocalData = {
  contacts: [],
  interactions: [],
};

export function getLocalData(): LocalData {
  if (typeof window === "undefined") return emptyData;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return emptyData;

    const data = JSON.parse(stored);
    // Convert date strings back to Date objects
    return {
      contacts: data.contacts.map((c: any) => ({
        ...c,
        createdAt: new Date(c.createdAt),
      })),
      interactions: data.interactions.map((i: any) => ({
        ...i,
        date: new Date(i.date),
      })),
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

  // Remove contact and all its interactions
  data.contacts.splice(contactIndex, 1);
  data.interactions = data.interactions.filter((i) => i.contactId !== id);

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

export function getContactsWithLastInteraction(): ContactWithLastInteraction[] {
  const data = getLocalData();

  const contactsWithInteractions = data.contacts.map((contact) => {
    const interactions = data.interactions
      .filter((i) => i.contactId === contact.id)
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    const lastInteraction = interactions[0]?.date;

    return {
      ...contact,
      lastInteraction,
      timeSinceLastInteraction: lastInteraction ? formatTimeSince(lastInteraction) : undefined,
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
