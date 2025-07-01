"use client";

import { useState } from "react";
import { format, addDays, addWeeks, addMonths, addYears } from "date-fns";
import { X, Calendar, Clock, Repeat } from "lucide-react";
import type { CreateReminderData, ReminderType, RecurringUnit, Reminder } from "@/lib/types";

interface ReminderFormProps {
  contactId: string;
  contactName: string;
  onSubmit: (reminderData: CreateReminderData) => Promise<void>;
  onCancel: () => void;
  existingReminder?: Reminder;
}

export function ReminderForm({
  contactId,
  contactName,
  onSubmit,
  onCancel,
  existingReminder,
}: ReminderFormProps) {
  const [title, setTitle] = useState(existingReminder?.title || "");
  const [description, setDescription] = useState(existingReminder?.description || "");
  const [dueDate, setDueDate] = useState(
    existingReminder?.dueDate
      ? format(existingReminder.dueDate, "yyyy-MM-dd'T'HH:mm")
      : format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [reminderType, setReminderType] = useState<ReminderType>(
    existingReminder?.reminderType || "ONE_TIME"
  );
  const [recurringUnit, setRecurringUnit] = useState<RecurringUnit>(
    existingReminder?.recurringUnit || "DAYS"
  );
  const [recurringValue, setRecurringValue] = useState(existingReminder?.recurringValue || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick preset options
  const quickPresets = [
    {
      label: "In 1 hour",
      action: () => setDueDate(format(addDays(new Date(), 0), "yyyy-MM-dd'T'HH:mm")),
    },
    {
      label: "Tomorrow",
      action: () => setDueDate(format(addDays(new Date(), 1), "yyyy-MM-dd'T'09:mm")),
    },
    {
      label: "In 3 days",
      action: () => setDueDate(format(addDays(new Date(), 3), "yyyy-MM-dd'T'09:mm")),
    },
    {
      label: "In 1 week",
      action: () => setDueDate(format(addWeeks(new Date(), 1), "yyyy-MM-dd'T'09:mm")),
    },
    {
      label: "In 1 month",
      action: () => setDueDate(format(addMonths(new Date(), 1), "yyyy-MM-dd'T'09:mm")),
    },
  ];

  // Common reminder title presets
  const titlePresets = [
    { label: "🎂 Birthday", title: "Birthday", description: "" },
    { label: "📞 Call", title: "Call", description: "" },
    { label: "💬 Message", title: "Send message", description: "" },
    { label: "✅ Check in", title: "Check in", description: "" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    setIsSubmitting(true);

    try {
      const reminderData: CreateReminderData = {
        contactId,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate: new Date(dueDate),
        reminderType,
        recurringUnit: reminderType === "RECURRING" ? recurringUnit : undefined,
        recurringValue: reminderType === "RECURRING" ? recurringValue : undefined,
      };

      await onSubmit(reminderData);
    } catch (error) {
      console.error("Error creating reminder:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {existingReminder ? "Edit Reminder" : "Add Reminder"} for {contactName}
        </h3>
        <button
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Reminder Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
            placeholder="e.g., Call about birthday, Check in, Schedule meeting"
            required
            autoFocus
          />

          {/* Title presets */}
          <div className="mt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Common reminders:</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {titlePresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setTitle(preset.title);
                    setDescription(preset.description);
                  }}
                  className={`px-2 py-1.5 text-xs rounded-md border transition-colors text-left ${
                    title === preset.title
                      ? "bg-black dark:bg-white text-white dark:text-black border-black dark:border-white"
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Description (optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
            rows={3}
            placeholder="Additional details about this reminder"
          />
        </div>

        {/* Due Date */}
        <div>
          <label
            htmlFor="dueDate"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Due Date & Time *
          </label>
          <input
            type="datetime-local"
            id="dueDate"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
            required
          />

          {/* Quick presets */}
          <div className="mt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick presets:</div>
            <div className="flex flex-wrap gap-2">
              {quickPresets.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={preset.action}
                  className="px-2 py-1 text-xs rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reminder Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Reminder Type
          </label>
          <div className="flex gap-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="reminderType"
                value="ONE_TIME"
                checked={reminderType === "ONE_TIME"}
                onChange={(e) => setReminderType(e.target.value as ReminderType)}
                className="mr-2"
              />
              <Calendar className="w-4 h-4 mr-1" />
              One-time
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="reminderType"
                value="RECURRING"
                checked={reminderType === "RECURRING"}
                onChange={(e) => setReminderType(e.target.value as ReminderType)}
                className="mr-2"
              />
              <Repeat className="w-4 h-4 mr-1" />
              Recurring
            </label>
          </div>
        </div>

        {/* Recurring Options */}
        {reminderType === "RECURRING" && (
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Repeat every
            </label>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min="1"
                max="365"
                value={recurringValue}
                onChange={(e) => setRecurringValue(parseInt(e.target.value) || 1)}
                className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
              />
              <select
                value={recurringUnit}
                onChange={(e) => setRecurringUnit(e.target.value as RecurringUnit)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
              >
                <option value="DAYS">Day(s)</option>
                <option value="WEEKS">Week(s)</option>
                <option value="MONTHS">Month(s)</option>
                <option value="YEARS">Year(s)</option>
              </select>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Examples: Birthday every 1 year, Weekly check-in every 1 week
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? "Creating..."
              : existingReminder
              ? "Update Reminder"
              : "Create Reminder"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
