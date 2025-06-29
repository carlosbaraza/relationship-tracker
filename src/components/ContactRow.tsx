"use client";

import { Plus } from "lucide-react";
import Link from "next/link";
import type { ContactWithLastInteraction } from "@/lib/types";
import { addInteraction } from "@/lib/storage";

interface ContactRowProps {
  contact: ContactWithLastInteraction;
  onInteractionAdded: () => void;
}

export function ContactRow({ contact, onInteractionAdded }: ContactRowProps) {
  const handleQuickInteraction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addInteraction(contact.id);
    onInteractionAdded();
  };

  return (
    <div className="flex items-center justify-between py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors group">
      <Link href={`/contacts/${contact.id}`} className="flex-1 flex items-center space-x-3 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {contact.name}
            </h3>
            {contact.timeSinceLastInteraction && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {contact.timeSinceLastInteraction}
              </span>
            )}
          </div>
        </div>
      </Link>

      <button
        onClick={handleQuickInteraction}
        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
        aria-label={`Add interaction for ${contact.name}`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
