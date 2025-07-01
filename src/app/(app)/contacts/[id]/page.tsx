"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, Plus, Calendar, List, Bell } from "lucide-react";
import { format } from "date-fns";
import { InteractionCalendar } from "@/components/InteractionCalendar";
import { ReminderForm } from "@/components/ReminderForm";
import { ReminderList } from "@/components/ReminderList";
import { useAuth } from "@/components/AuthProvider";
import { useAutoRefresh } from "@/lib/use-auto-refresh";
import type { Contact, Interaction, Reminder, CreateReminderData } from "@/lib/types";

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.id as string;
  const { storageManager, isLoading: authLoading } = useAuth();

  const [contact, setContact] = useState<Contact | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"calendar" | "list" | "reminders">("calendar");
  const [showAddInteraction, setShowAddInteraction] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newInteractionDate, setNewInteractionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [newInteractionNote, setNewInteractionNote] = useState("");
  const [editingInteraction, setEditingInteraction] = useState<string | null>(null);
  const [editingDate, setEditingDate] = useState("");
  const [editingNote, setEditingNote] = useState("");
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const loadContactData = useCallback(async () => {
    try {
      const foundContact = await storageManager.getContact(contactId);

      if (!foundContact) {
        router.push("/");
        return;
      }

      setContact(foundContact);
      const [contactInteractions, contactReminders] = await Promise.all([
        storageManager.getContactInteractions(contactId),
        storageManager.getContactReminders(contactId),
      ]);
      setInteractions(contactInteractions);
      setReminders(contactReminders);
      setLoading(false);
    } catch (error) {
      console.error("Error loading contact data:", error);
      router.push("/");
    }
  }, [contactId, router, storageManager]);

  // Set up auto-refresh for contact data
  const { manualRefresh } = useAutoRefresh(loadContactData, {
    enabled: !authLoading && !loading, // Only enable when not loading
    interval: 60000, // 1 minute
  });

  useEffect(() => {
    // Only load contact data after auth has finished loading
    if (!authLoading) {
      loadContactData();
    }
  }, [authLoading, loadContactData]);

  const handleDeleteContact = async () => {
    if (!contact) return;

    if (
      confirm(
        `Are you sure you want to delete ${contact.name}? This will also delete all their interactions and reminders and cannot be undone.`
      )
    ) {
      await storageManager.deleteContact(contactId);
      router.push("/");
    }
  };

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();

    const date = new Date(newInteractionDate);
    const note = newInteractionNote.trim() || undefined;

    await storageManager.addInteraction(contactId, date, note);

    // Reset form
    setNewInteractionDate(format(new Date(), "yyyy-MM-dd"));
    setNewInteractionNote("");
    setShowAddInteraction(false);

    // Reload data
    loadContactData();
  };

  const handleDeleteInteraction = async (interactionId: string) => {
    if (confirm("Delete this interaction?")) {
      await storageManager.deleteInteraction(interactionId);
      loadContactData();
    }
  };

  const handleStartEdit = (interaction: Interaction) => {
    setEditingInteraction(interaction.id);
    setEditingDate(format(interaction.date, "yyyy-MM-dd"));
    setEditingNote(interaction.note || "");
  };

  const handleSaveEdit = async (interactionId: string) => {
    const updates: Partial<Pick<Interaction, "date" | "note">> = {
      date: new Date(editingDate),
      note: editingNote.trim() || undefined,
    };
    await storageManager.updateInteraction(interactionId, updates);
    setEditingInteraction(null);
    setEditingDate("");
    setEditingNote("");
    loadContactData();
  };

  const handleCancelEdit = () => {
    setEditingInteraction(null);
    setEditingDate("");
    setEditingNote("");
  };

  const handleAddReminder = async (reminderData: CreateReminderData) => {
    await storageManager.addReminder(reminderData);
    setShowAddReminder(false);
    loadContactData();
  };

  const handleAcknowledgeReminder = async (reminderId: string) => {
    await storageManager.acknowledgeReminder(reminderId);
    loadContactData();
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowAddReminder(true);
  };

  const handleDeleteReminder = async (reminderId: string) => {
    if (confirm("Delete this reminder?")) {
      await storageManager.deleteReminder(reminderId);
      loadContactData();
    }
  };

  const handleUpdateReminder = async (reminderData: CreateReminderData) => {
    if (editingReminder) {
      await storageManager.updateReminder(editingReminder.id, {
        title: reminderData.title,
        description: reminderData.description,
        dueDate: reminderData.dueDate,
        reminderType: reminderData.reminderType,
        recurringUnit: reminderData.recurringUnit,
        recurringValue: reminderData.recurringValue,
      });
      setEditingReminder(null);
      setShowAddReminder(false);
      loadContactData();
    }
  };

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500 dark:text-gray-400">Loading contact...</div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400 mb-4">Contact not found</div>
        <button onClick={() => router.push("/")} className="text-black dark:text-white underline">
          Go back
        </button>
      </div>
    );
  }

  const dueReminders = reminders.filter(
    (r) => !r.isAcknowledged && new Date(r.dueDate) < new Date()
  );
  const upcomingReminders = reminders.filter(
    (r) => !r.isAcknowledged && new Date(r.dueDate) >= new Date()
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/")}
          className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to contacts</span>
        </button>

        <button
          onClick={handleDeleteContact}
          className="flex items-center space-x-2 px-3 py-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Contact</span>
        </button>
      </div>

      {/* Contact Info */}
      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {contact.name}
        </h1>
        {contact.group && <p className="text-gray-600 dark:text-gray-400">{contact.group}</p>}
        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-500">
          <span>
            {interactions.length} interaction{interactions.length !== 1 ? "s" : ""}
          </span>
          <span>
            {reminders.length} reminder{reminders.length !== 1 ? "s" : ""}
          </span>
          {dueReminders.length > 0 && (
            <span className="text-red-600 dark:text-red-400 font-medium">
              {dueReminders.length} due now
            </span>
          )}
        </div>
      </div>

      {/* View Mode and Add Actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex text-xs sm:text-base items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
              viewMode === "calendar"
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex text-xs sm:text-base items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
              viewMode === "list"
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <List className="w-4 h-4" />
            <span>Interactions</span>
          </button>
          <button
            onClick={() => setViewMode("reminders")}
            className={`flex text-xs sm:text-base items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
              viewMode === "reminders"
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Reminders</span>
            {reminders.filter((r) => !r.isAcknowledged).length > 0 && (
              <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded-full text-xs font-medium">
                {reminders.filter((r) => !r.isAcknowledged).length}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {viewMode === "reminders" ? (
            <button
              onClick={() => setShowAddReminder(!showAddReminder)}
              className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Reminder</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAddInteraction(!showAddInteraction)}
              className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Interaction</span>
            </button>
          )}
        </div>
      </div>

      {/* Add Reminder Form */}
      {showAddReminder && (
        <ReminderForm
          contactId={contactId}
          contactName={contact.name}
          onSubmit={editingReminder ? handleUpdateReminder : handleAddReminder}
          onCancel={() => {
            setShowAddReminder(false);
            setEditingReminder(null);
          }}
          existingReminder={editingReminder || undefined}
        />
      )}

      {/* Add Interaction Form */}
      {showAddInteraction && viewMode !== "reminders" && (
        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleAddInteraction} className="space-y-4">
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Date
              </label>
              <input
                type="date"
                id="date"
                value={newInteractionDate}
                onChange={(e) => setNewInteractionDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                required
              />
            </div>

            <div>
              <label
                htmlFor="note"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                Note (optional)
              </label>
              <textarea
                id="note"
                value={newInteractionNote}
                onChange={(e) => setNewInteractionNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                rows={3}
                placeholder="Optional note about this interaction"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
              >
                Add Interaction
              </button>
              <button
                type="button"
                onClick={() => setShowAddInteraction(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Content based on view mode */}
      {viewMode === "reminders" ? (
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Reminders for {contact.name}
            </h3>
          </div>
          <div className="p-4">
            <ReminderList
              reminders={reminders}
              onAcknowledge={handleAcknowledgeReminder}
              onEdit={handleEditReminder}
              onDelete={handleDeleteReminder}
              contactName={contact.name}
              showPastReminders={true}
            />
          </div>
        </div>
      ) : viewMode === "calendar" ? (
        <InteractionCalendar
          interactions={interactions}
          contactId={contactId}
          onInteractionAdded={loadContactData}
        />
      ) : (
        <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Interaction History
            </h3>
          </div>

          {interactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No interactions yet
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {interactions.map((interaction) => (
                <div key={interaction.id} className="p-4">
                  {editingInteraction === interaction.id ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Date
                        </label>
                        <input
                          type="date"
                          value={editingDate}
                          onChange={(e) => setEditingDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Note (optional)
                        </label>
                        <textarea
                          value={editingNote}
                          onChange={(e) => setEditingNote(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                          rows={3}
                          placeholder="Optional note about this interaction"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveEdit(interaction.id)}
                          className="px-3 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors text-sm"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {format(interaction.date, "MMM d, yyyy")}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {format(interaction.date, "h:mm a")}
                        </div>
                        {interaction.note && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
                            {interaction.note}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleStartEdit(interaction)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                          aria-label="Edit interaction"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteInteraction(interaction.id)}
                          className="p-1 text-red-400 hover:text-red-600 transition-colors"
                          aria-label="Delete interaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
