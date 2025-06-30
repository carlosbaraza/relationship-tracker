"use client";

import { auth } from "./auth";
import { getLocalData, saveLocalData, clearLocalData } from "./storage";
import * as dbActions from "@/app/(app)/actions";
import type { Contact, Interaction, LocalData, ContactWithLastInteraction } from "./types";

// This is the main storage interface that components should use
// It automatically switches between localStorage and database based on auth status

export class StorageManager {
  private static instance: StorageManager;
  private isAuthenticated: boolean = false;

  private constructor() {}

  static getInstance(): StorageManager {
    if (!StorageManager.instance) {
      StorageManager.instance = new StorageManager();
    }
    return StorageManager.instance;
  }

  async setAuthStatus(authenticated: boolean) {
    this.isAuthenticated = authenticated;
  }

  async getContactsWithLastInteraction(): Promise<ContactWithLastInteraction[]> {
    if (this.isAuthenticated) {
      // Use database
      const contacts = await dbActions.getContacts();
      return contacts as ContactWithLastInteraction[];
    } else {
      // Use localStorage
      const { getContactsWithLastInteraction } = await import("./storage");
      return getContactsWithLastInteraction();
    }
  }

  async addContact(name: string, group?: string): Promise<Contact> {
    if (this.isAuthenticated) {
      // Use database
      const formData = new FormData();
      formData.append("name", name);
      if (group) formData.append("group", group);
      return await dbActions.addContact(formData);
    } else {
      // Use localStorage
      const { addContact } = await import("./storage");
      return addContact(name, group);
    }
  }

  async deleteContact(contactId: string): Promise<boolean> {
    if (this.isAuthenticated) {
      // Use database
      await dbActions.deleteContact(contactId);
      return true;
    } else {
      // Use localStorage
      const { deleteContact } = await import("./storage");
      return deleteContact(contactId);
    }
  }

  async addInteraction(contactId: string, date?: Date, note?: string): Promise<Interaction | null> {
    if (this.isAuthenticated) {
      // Use database
      return await dbActions.addInteraction(contactId, date, note);
    } else {
      // Use localStorage
      const { addInteraction } = await import("./storage");
      return addInteraction(contactId, date, note);
    }
  }

  async getContact(contactId: string): Promise<Contact | null> {
    if (this.isAuthenticated) {
      // Use database
      return await dbActions.getContact(contactId);
    } else {
      // Use localStorage
      const data = getLocalData();
      return data.contacts.find((c) => c.id === contactId) || null;
    }
  }

  async getContactInteractions(contactId: string): Promise<Interaction[]> {
    if (this.isAuthenticated) {
      // Use database
      return await dbActions.getContactInteractions(contactId);
    } else {
      // Use localStorage
      const { getContactInteractions } = await import("./storage");
      return getContactInteractions(contactId);
    }
  }

  async updateInteraction(
    interactionId: string,
    updates: Partial<Pick<Interaction, "date" | "note">>
  ): Promise<Interaction | null> {
    if (this.isAuthenticated) {
      // Use database
      return await dbActions.updateInteraction(interactionId, updates);
    } else {
      // Use localStorage
      const { updateInteraction } = await import("./storage");
      return updateInteraction(interactionId, updates);
    }
  }

  async deleteInteraction(interactionId: string): Promise<boolean> {
    if (this.isAuthenticated) {
      // Use database
      await dbActions.deleteInteraction(interactionId);
      return true;
    } else {
      // Use localStorage
      const { deleteInteraction } = await import("./storage");
      return deleteInteraction(interactionId);
    }
  }

  async migrateToCloud(): Promise<void> {
    if (!this.isAuthenticated) {
      throw new Error("Must be authenticated to migrate data");
    }

    const localData = getLocalData();
    if (localData.contacts.length > 0 || localData.interactions.length > 0) {
      await dbActions.migrateLocalData(localData);
      clearLocalData();
    }
  }

  async clearLocalData(): Promise<void> {
    clearLocalData();
  }

  getLocalData(): LocalData {
    return getLocalData();
  }

  hasLocalData(): boolean {
    const data = getLocalData();
    return data.contacts.length > 0 || data.interactions.length > 0;
  }
}
