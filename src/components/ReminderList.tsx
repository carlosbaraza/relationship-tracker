"use client";

import { useState, useEffect } from "react";
import { format, isAfter, isBefore, differenceInDays, differenceInHours } from "date-fns";
import {
  Bell,
  BellRing,
  Check,
  Edit,
  Trash2,
  Repeat,
  Clock,
  AlertTriangle,
  History,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { Reminder } from "@/lib/types";

interface ReminderListProps {
  reminders: Reminder[];
  onAcknowledge: (reminderId: string) => Promise<void>;
  onEdit: (reminder: Reminder) => void;
  onDelete: (reminderId: string) => Promise<void>;
  showContactName?: boolean;
  contactName?: string;
  showPastReminders?: boolean;
  getContactName?: (contactId: string) => Promise<string | null>;
}

export function ReminderList({
  reminders,
  onAcknowledge,
  onEdit,
  onDelete,
  showContactName = false,
  contactName,
  showPastReminders = false,
  getContactName,
}: ReminderListProps) {
  const [acknowledging, setAcknowledging] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showAcknowledged, setShowAcknowledged] = useState(false);
  const [contactNames, setContactNames] = useState<Record<string, string>>({});

  // Fetch contact names when getContactName is provided
  useEffect(() => {
    if (getContactName && showContactName) {
      const fetchContactNames = async () => {
        const names: Record<string, string> = {};
        const uniqueContactIds = [...new Set(reminders.map((r) => r.contactId))];

        await Promise.all(
          uniqueContactIds.map(async (contactId) => {
            const name = await getContactName(contactId);
            if (name) {
              names[contactId] = name;
            }
          })
        );

        setContactNames(names);
      };

      fetchContactNames();
    }
  }, [reminders, getContactName, showContactName]);

  if (reminders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p>No reminders {showContactName ? "for this contact" : ""}</p>
      </div>
    );
  }

  const now = new Date();

  // Group reminders by status
  const dueReminders = reminders.filter((r) => !r.isAcknowledged && isBefore(r.dueDate, now));
  const upcomingReminders = reminders.filter(
    (r) => !r.isAcknowledged && isAfter(r.dueDate, now) && differenceInDays(r.dueDate, now) <= 30
  );
  const futureReminders = reminders.filter(
    (r) => !r.isAcknowledged && isAfter(r.dueDate, now) && differenceInDays(r.dueDate, now) > 30
  );
  const acknowledgedReminders = reminders.filter((r) => r.isAcknowledged);

  const handleAcknowledge = async (reminderId: string) => {
    setAcknowledging(reminderId);
    try {
      await onAcknowledge(reminderId);
    } catch (error) {
      console.error("Error acknowledging reminder:", error);
    } finally {
      setAcknowledging(null);
    }
  };

  const handleDelete = async (reminderId: string) => {
    setDeleting(reminderId);
    try {
      await onDelete(reminderId);
    } catch (error) {
      console.error("Error deleting reminder:", error);
    } finally {
      setDeleting(null);
    }
  };

  const formatTimeUntil = (date: Date) => {
    const diffDays = differenceInDays(date, now);
    const diffHours = differenceInHours(date, now);

    if (diffDays > 0) {
      return `in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
    } else if (diffHours > 0) {
      return `in ${diffHours} hour${diffHours === 1 ? "" : "s"}`;
    } else {
      return "due now";
    }
  };

  const formatOverdue = (date: Date) => {
    const diffDays = Math.abs(differenceInDays(date, now));
    const diffHours = Math.abs(differenceInHours(date, now));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays === 1 ? "" : "s"} overdue`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} overdue`;
    } else {
      return "just due";
    }
  };

  const ReminderItem = ({
    reminder,
    isDue = false,
    isAcknowledged = false,
  }: {
    reminder: Reminder;
    isDue?: boolean;
    isAcknowledged?: boolean;
  }) => (
    <div
      key={reminder.id}
      className={`p-4 rounded-lg border transition-all ${
        isAcknowledged
          ? "bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 opacity-75"
          : isDue
          ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isAcknowledged ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : isDue ? (
              <AlertTriangle className="w-4 h-4 text-red-500" />
            ) : (
              <Bell className="w-4 h-4 text-gray-400" />
            )}
            <h4
              className={`font-medium ${
                isAcknowledged
                  ? "text-gray-600 dark:text-gray-400"
                  : isDue
                  ? "text-red-900 dark:text-red-100"
                  : "text-gray-900 dark:text-gray-100"
              }`}
            >
              {reminder.title}
            </h4>
            {reminder.reminderType === "RECURRING" && <Repeat className="w-3 h-3 text-gray-400" />}
            {isAcknowledged && (
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded-full">
                Completed
              </span>
            )}
          </div>

          {showContactName && (contactName || contactNames[reminder.contactId]) && (
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              for {contactName || contactNames[reminder.contactId]}
            </div>
          )}

          {reminder.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{reminder.description}</p>
          )}

          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(reminder.dueDate, "MMM d, yyyy 'at' h:mm a")}
            </div>
            {!isAcknowledged && (
              <div className={`${isDue ? "text-red-600 dark:text-red-400 font-medium" : ""}`}>
                {isDue ? formatOverdue(reminder.dueDate) : formatTimeUntil(reminder.dueDate)}
              </div>
            )}
            {isAcknowledged && reminder.acknowledgedAt && (
              <div className="text-green-600 dark:text-green-400">
                Completed {format(reminder.acknowledgedAt, "MMM d, yyyy")}
              </div>
            )}
            {reminder.reminderType === "RECURRING" && (
              <div className="text-xs text-gray-400">
                Repeats every {reminder.recurringValue} {reminder.recurringUnit?.toLowerCase()}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {!reminder.isAcknowledged && (
            <button
              onClick={() => handleAcknowledge(reminder.id)}
              disabled={acknowledging === reminder.id}
              className={`p-1 rounded-md transition-colors ${
                isDue
                  ? "text-red-600 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-800/30"
                  : "text-green-600 hover:text-green-700 hover:bg-green-100 dark:hover:bg-green-800/30"
              } disabled:opacity-50`}
              title="Mark as complete"
            >
              <Check className="w-4 h-4" />
            </button>
          )}

          {!isAcknowledged && (
            <button
              onClick={() => onEdit(reminder)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Edit reminder"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => handleDelete(reminder.id)}
            disabled={deleting === reminder.id}
            className="p-1 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
            title="Delete reminder"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Due Reminders */}
      {dueReminders.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BellRing className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-medium text-red-700 dark:text-red-300">
              Due Now ({dueReminders.length})
            </h3>
          </div>
          <div className="space-y-3">
            {dueReminders.map((reminder) => (
              <ReminderItem key={reminder.id} reminder={reminder} isDue={true} />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Reminders */}
      {upcomingReminders.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Upcoming (Next 30 days)
            </h3>
          </div>
          <div className="space-y-3">
            {upcomingReminders.map((reminder) => (
              <ReminderItem key={reminder.id} reminder={reminder} />
            ))}
          </div>
        </div>
      )}

      {/* Future Reminders */}
      {futureReminders.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
              Future Reminders
            </h3>
          </div>
          <div className="space-y-3">
            {futureReminders.map((reminder) => (
              <ReminderItem key={reminder.id} reminder={reminder} />
            ))}
          </div>
        </div>
      )}

      {/* Past Reminders */}
      {showPastReminders && acknowledgedReminders.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setShowAcknowledged(!showAcknowledged)}
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md p-1 transition-colors"
            >
              {showAcknowledged ? (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-400" />
              )}
              <History className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
                Past Reminders ({acknowledgedReminders.length})
              </h3>
            </button>
          </div>
          {showAcknowledged && (
            <div className="space-y-3">
              {acknowledgedReminders
                .sort(
                  (a, b) =>
                    new Date(b.acknowledgedAt || 0).getTime() -
                    new Date(a.acknowledgedAt || 0).getTime()
                )
                .map((reminder) => (
                  <ReminderItem key={reminder.id} reminder={reminder} isAcknowledged={true} />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
