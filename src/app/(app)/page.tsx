"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { ContactList } from "@/components/ContactList";
import { useAuth } from "@/components/AuthProvider";

export default function HomePage() {
  const { storageManager, isLoading: authLoading } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);

  // Get available groups for quick select
  const getAvailableGroups = async () => {
    const contacts = await storageManager.getContactsWithLastInteraction();
    const existingGroups = Array.from(
      new Set(contacts.map((c) => c.group).filter((g): g is string => Boolean(g)))
    );
    const defaultGroups = ["Friends", "Family", "Work"];
    const userGroups = existingGroups.filter((g) => !defaultGroups.includes(g));
    return [...userGroups, ...defaultGroups];
  };

  // Load available groups on component mount
  React.useEffect(() => {
    // Only load available groups after auth has finished loading
    if (!authLoading) {
      getAvailableGroups().then(setAvailableGroups);
    }
  }, [storageManager, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    await storageManager.addContact(name.trim(), group.trim() || undefined);

    // Reset form
    setName("");
    setGroup("");
    setShowAddForm(false);

    // Trigger refresh of contact list
    setRefreshKey((prev) => prev + 1);

    // Refresh available groups
    if (!authLoading) {
      getAvailableGroups().then(setAvailableGroups);
    }
  };

  const handleCancel = () => {
    setName("");
    setGroup("");
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Add Contact Section */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Contacts</h2>

        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        ) : (
          <button
            onClick={handleCancel}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        )}
      </div>

      {/* Add Contact Form */}
      {showAddForm && (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                placeholder="Enter contact name"
                autoFocus
                required
              />
            </div>

            <div>
              <label
                htmlFor="group"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Group (optional)
              </label>
              <input
                type="text"
                id="group"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                placeholder="e.g., Family, Friends, Work"
              />
              {/* Quick select buttons for groups */}
              {availableGroups.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick select:</div>
                  <div className="flex flex-wrap gap-2">
                    {availableGroups.map((groupOption) => (
                      <button
                        key={groupOption}
                        type="button"
                        onClick={() => setGroup(groupOption)}
                        className={`px-2 py-1 text-xs rounded-md transition-colors ${
                          group === groupOption
                            ? "bg-black dark:bg-white text-white dark:text-black"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {groupOption}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                Add Contact
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Contact List */}
      <div key={refreshKey}>
        <ContactList />
      </div>
    </div>
  );
}
