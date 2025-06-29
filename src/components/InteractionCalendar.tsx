"use client";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
} from "date-fns";
import { X, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import type { Interaction } from "@/lib/types";
import { addInteraction } from "@/lib/storage";

interface InteractionCalendarProps {
  interactions: Interaction[];
  currentDate?: Date;
  contactId: string;
  onInteractionAdded: () => void;
}

export function InteractionCalendar({
  interactions,
  currentDate = new Date(),
  contactId,
  onInteractionAdded,
}: InteractionCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [newInteractionNote, setNewInteractionNote] = useState("");
  const [viewDate, setViewDate] = useState(currentDate);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Start week on Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const getInteractionsForDate = (date: Date) => {
    return interactions.filter((interaction) => isSameDay(interaction.date, date));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowModal(true);
  };

  const handleAddInteraction = () => {
    if (!selectedDate) return;

    const note = newInteractionNote.trim() || undefined;
    addInteraction(contactId, selectedDate, note);

    // Reset and close modal
    setNewInteractionNote("");
    setShowModal(false);
    setSelectedDate(null);
    onInteractionAdded();
  };

  const selectedDateInteractions = selectedDate ? getInteractionsForDate(selectedDate) : [];

  const handlePreviousMonth = () => {
    setViewDate(subMonths(viewDate, 1));
  };

  const handleNextMonth = () => {
    setViewDate(addMonths(viewDate, 1));
  };

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="bg-white dark:bg-black border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={handlePreviousMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          aria-label="Previous month"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          {format(viewDate, "MMMM yyyy")}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
          aria-label="Next month"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* Weekday headers */}
        {weekdays.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays.map((day) => {
          const dayInteractions = getInteractionsForDate(day);
          const isCurrentMonth = isSameMonth(day, viewDate);
          const isToday = isSameDay(day, new Date());

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleDateClick(day)}
              className={`
                p-2 min-h-[40px] border border-gray-100 dark:border-gray-800 relative hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                ${isCurrentMonth ? "bg-white dark:bg-black" : "bg-gray-50 dark:bg-gray-900"}
                ${isToday ? "ring-2 ring-black dark:ring-white" : ""}
              `}
            >
              <div
                className={`text-sm ${
                  isCurrentMonth
                    ? "text-gray-900 dark:text-gray-100"
                    : "text-gray-400 dark:text-gray-600"
                }`}
              >
                {format(day, "d")}
              </div>

              {dayInteractions.length > 0 && (
                <div className="absolute bottom-1 right-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {dayInteractions.length > 1 && (
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      +{dayInteractions.length - 1}
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
        <span>Interaction</span>
      </div>

      {/* Modal for selected date */}
      {showModal && selectedDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                {format(selectedDate, "MMM d, yyyy")}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Existing interactions */}
              {selectedDateInteractions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Existing interactions:
                  </h4>
                  <div className="space-y-2">
                    {selectedDateInteractions.map((interaction) => (
                      <div
                        key={interaction.id}
                        className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md"
                      >
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {format(interaction.date, "h:mm a")}
                        </div>
                        {interaction.note && (
                          <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                            {interaction.note}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add new interaction */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Add new interaction:
                </h4>
                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="interaction-note"
                      className="block text-sm text-gray-600 dark:text-gray-400 mb-1"
                    >
                      Note (optional)
                    </label>
                    <textarea
                      id="interaction-note"
                      value={newInteractionNote}
                      onChange={(e) => setNewInteractionNote(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent"
                      rows={3}
                      placeholder="What did you do together?"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddInteraction}
                      className="flex items-center space-x-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Interaction</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
