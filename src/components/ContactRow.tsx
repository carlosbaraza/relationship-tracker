"use client";

import { Plus, Trash2, Bell, BellRing } from "lucide-react";
import Link from "next/link";
import type { ContactWithLastInteraction } from "@/lib/types";
import { useAuth } from "./AuthProvider";

interface ContactRowProps {
  contact: ContactWithLastInteraction;
  onInteractionAdded: () => void;
  onContactDeleted?: () => void;
}

export function ContactRow({ contact, onInteractionAdded, onContactDeleted }: ContactRowProps) {
  const { storageManager } = useAuth();

  const handleQuickInteraction = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    await storageManager.addInteraction(contact.id);
    onInteractionAdded();
  };

  const handleDeleteContact = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      confirm(
        `Are you sure you want to delete ${contact.name}? This will also delete all their interactions and reminders.`
      )
    ) {
      await storageManager.deleteContact(contact.id);
      onContactDeleted?.();
    }
  };

  const dueCount = contact.dueReminders?.length || 0;
  const upcomingCount = contact.upcomingReminders?.length || 0;

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group">
      <Link href={`/contacts/${contact.id}`} className="flex-1 flex items-center space-x-3 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {contact.name}
            </h3>

            {/* Reminder indicators */}
            <div className="flex items-center space-x-1">
              {dueCount > 0 && (
                <div className="flex items-center space-x-1">
                  <BellRing className="w-3 h-3 text-red-500" />
                  <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded-full font-medium">
                    {dueCount} due
                  </span>
                </div>
              )}

              {upcomingCount > 0 && (
                <div className="flex items-center space-x-1">
                  <Bell className="w-3 h-3 text-yellow-500" />
                  <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-1.5 py-0.5 rounded-full font-medium">
                    {upcomingCount} upcoming
                  </span>
                </div>
              )}
            </div>

            {contact.timeSinceLastInteraction && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {contact.timeSinceLastInteraction}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="flex items-center space-x-1">
        <button
          onClick={handleQuickInteraction}
          className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
          aria-label={`Add interaction for ${contact.name}`}
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={handleDeleteContact}
          className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
          aria-label={`Delete ${contact.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
