"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import cuid from "cuid";

export async function addInteractionToContact(contactId: string, date: Date, note?: string) {
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
      date,
      note: note?.trim() || null,
    },
  });

  revalidatePath(`/contacts/${contactId}`);
  return interaction;
}
