"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Bell, BellRing, BellOff } from "lucide-react";
import { ContactList } from "@/components/ContactList";
import { ReminderList } from "@/components/ReminderList";
import { useAuth } from "@/components/AuthProvider";
import type { Reminder } from "@/lib/types";

export default function HomePage() {
  const {
    storageManager,
    isLoading: authLoading,
    requestNotificationPermission,
    canShowNotifications,
  } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [dueReminders, setDueReminders] = useState<Reminder[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [showReminders, setShowReminders] = useState(false);
  const [showNotificationBanner, setShowNotificationBanner] = useState(false);
  const [notificationPermissionRequested, setNotificationPermissionRequested] = useState(false);

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

  // Load reminders
  const loadReminders = async () => {
    if (!authLoading) {
      const [due, upcoming] = await Promise.all([
        storageManager.getDueReminders(),
        storageManager.getUpcomingReminders(30),
      ]);
      setDueReminders(due);
      setUpcomingReminders(upcoming);
    }
  };

  // Load available groups on component mount
  React.useEffect(() => {
    // Only load available groups after auth has finished loading
    if (!authLoading) {
      getAvailableGroups().then(setAvailableGroups);
      loadReminders();
    }
  }, [storageManager, authLoading]);

  // Check if we should show notification banner
  React.useEffect(() => {
    // Don't show notification banner by default - user can manually enable if needed
    setShowNotificationBanner(false);
  }, [
    authLoading,
    canShowNotifications,
    notificationPermissionRequested,
    dueReminders.length,
    upcomingReminders.length,
  ]);

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

  const handleAcknowledgeReminder = async (reminderId: string) => {
    await storageManager.acknowledgeReminder(reminderId);
    await loadReminders();
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (confirm("Delete this reminder?")) {
      await storageManager.deleteReminder(reminderId);
      await loadReminders();
    }
  };

  const handleEditReminder = (reminder: Reminder) => {
    // For now, just navigate to the contact page where reminders can be managed
    window.location.href = `/contacts/${reminder.contactId}`;
  };

  const handleRequestNotifications = async () => {
    setNotificationPermissionRequested(true);
    const permission = await requestNotificationPermission();
    if (permission === "granted") {
      setShowNotificationBanner(false);
    }
  };

  const handleDismissNotificationBanner = () => {
    setNotificationPermissionRequested(true);
    setShowNotificationBanner(false);
  };

  const totalDueReminders = dueReminders.length;
  const totalUpcomingReminders = upcomingReminders.length;

  return (
    <div className="space-y-6">
      {/* Notification Permission Banner */}
      {showNotificationBanner && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Enable Reminder Notifications
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                  Get notified when your reminders are due so you never miss an important
                  interaction.
                </p>
                <div className="flex items-center space-x-3 mt-3">
                  <button
                    onClick={handleRequestNotifications}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                  >
                    <Bell className="w-4 h-4" />
                    <span>Enable Notifications</span>
                  </button>
                  <button
                    onClick={handleDismissNotificationBanner}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={handleDismissNotificationBanner}
              className="p-1 text-blue-400 hover:text-blue-600 dark:hover:text-blue-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Reminder Dashboard */}
      {(totalDueReminders > 0 || totalUpcomingReminders > 0) && (
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Reminders</h2>
                {totalDueReminders > 0 && (
                  <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded-full text-sm font-medium">
                    {totalDueReminders} due
                  </span>
                )}
                {totalUpcomingReminders > 0 && (
                  <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded-full text-sm font-medium">
                    {totalUpcomingReminders} upcoming
                  </span>
                )}
                {!canShowNotifications && (
                  <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                    <BellOff className="w-3 h-3" />
                    <span>Notifications disabled</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowReminders(!showReminders)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                {showReminders ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {showReminders && (
            <div className="p-4">
              <ReminderList
                reminders={[...dueReminders, ...upcomingReminders]}
                onAcknowledge={handleAcknowledgeReminder}
                onEdit={handleEditReminder}
                onDelete={handleDeleteReminder}
                showContactName={true}
                getContactName={async (contactId: string) => {
                  const contact = await storageManager.getContact(contactId);
                  return contact?.name || null;
                }}
              />
            </div>
          )}
        </div>
      )}

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
