export interface Contact {
  id: string;
  name: string;
  group?: string;
  createdAt: Date;
}

export interface Interaction {
  id: string;
  contactId: string;
  date: Date;
  note?: string;
}

export interface LocalData {
  contacts: Contact[];
  interactions: Interaction[];
}

export interface ContactWithLastInteraction extends Contact {
  lastInteraction?: Date;
  timeSinceLastInteraction?: string;
}
