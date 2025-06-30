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

export interface LocalData {
  contacts: Contact[];
  interactions: Interaction[];
}

export interface ContactWithLastInteraction extends Contact {
  lastInteraction?: Date;
  timeSinceLastInteraction?: string;
}

// Database types
export interface DbContact {
  id: string;
  name: string;
  group: string | null;
  userId: string;
  createdAt: Date;
  interactions: DbInteraction[];
}

export interface DbInteraction {
  id: string;
  contactId: string;
  date: Date;
  note: string | null;
}
