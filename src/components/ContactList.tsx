"use client";

import { useState, useEffect } from "react";
import { ContactRow } from "./ContactRow";
import type { ContactWithLastInteraction } from "@/lib/types";
import { useAuth } from "./AuthProvider";

export function ContactList() {
  const { storageManager, isAuthenticated, isLoading: authLoading } = useAuth();
  const [contacts, setContacts] = useState<ContactWithLastInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>("all");

  const loadContacts = async () => {
    const data = await storageManager.getContactsWithLastInteraction();
    setContacts(data);
    setLoading(false);
  };

  useEffect(() => {
    // Only load contacts after auth has finished loading
    if (!authLoading) {
      loadContacts();
    }
  }, [isAuthenticated, authLoading]);

  const handleInteractionAdded = () => {
    loadContacts();
  };

  const handleContactDeleted = () => {
    loadContacts();
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 dark:text-gray-400">Loading contacts...</div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400 mb-4">No contacts yet</div>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Add your first contact to start tracking interactions
        </p>
      </div>
    );
  }

  // Filter contacts by selected group
  const filteredContacts =
    selectedGroup === "all"
      ? contacts
      : contacts.filter((contact) => {
          const group = contact.group || "No Group";
          return group === selectedGroup;
        });

  // Group contacts by group
  const groupedContacts: Record<string, ContactWithLastInteraction[]> = {};
  filteredContacts.forEach((contact) => {
    const group = contact.group || "No Group";
    if (!groupedContacts[group]) {
      groupedContacts[group] = [];
    }
    groupedContacts[group].push(contact);
  });

  const sortedGroups = Object.keys(groupedContacts).sort((a, b) => {
    // Put "No Group" at the end
    if (a === "No Group") return 1;
    if (b === "No Group") return -1;
    return a.localeCompare(b);
  });

  // Get all available groups for filter buttons (only show groups that actually have contacts)
  const allGroups = Array.from(new Set(contacts.map((c) => c.group || "No Group")));
  const visibleGroups = allGroups.sort((a, b) => {
    // Put "No Group" at the end
    if (a === "No Group") return 1;
    if (b === "No Group") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      {/* Group Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedGroup("all")}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            selectedGroup === "all"
              ? "bg-black dark:bg-white text-white dark:text-black"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          All
        </button>
        {visibleGroups.map((group) => (
          <button
            key={group}
            onClick={() => setSelectedGroup(group)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              selectedGroup === group
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {group}
          </button>
        ))}
      </div>

      {/* Contact Groups */}
      {sortedGroups.map((group) => (
        <div key={group}>
          <div className="sticky top-0 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 pb-2 mb-2">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {group}
            </h2>
          </div>
          <div className="space-y-1">
            {groupedContacts[group].map((contact) => (
              <ContactRow
                key={contact.id}
                contact={contact}
                onInteractionAdded={handleInteractionAdded}
                onContactDeleted={handleContactDeleted}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
