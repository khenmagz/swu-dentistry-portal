import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import {
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiX,
  FiCalendar,
  FiClock,
  FiAlignLeft,
  FiTrash2,
} from "react-icons/fi";

export default function Calendar() {
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    color: "#4f46e5",
  });

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  useEffect(() => {
    const q = query(collection(db, "events"), orderBy("startDate", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEvents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(fetchedEvents);
    });
    return () => unsubscribe();
  }, []);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const getDaysInMonth = (year, month) =>
    new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  const endEmptyCells = (7 - ((firstDayIndex + daysInMonth) % 7)) % 7;

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const getEventsForDay = (day) => {
    const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter(
      (event) => dateString >= event.startDate && dateString <= event.endDate,
    );
  };

  const summaryEvents = events.filter((event) => {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const firstDayOfCurrentMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0);

    return start <= lastDayOfCurrentMonth && end >= firstDayOfCurrentMonth;
  });

  // FIX: Limit summary rows to 3 so it wraps into a new column after the 3rd event
  const summaryRowCount = Math.min(3, Math.max(1, summaryEvents.length));

  // FIX: Removed parentheses from the output
  const getSummaryDateText = (startDate, endDate, title) => {
    const startDay = parseInt(startDate.split("-")[2], 10);
    const endDay = parseInt(endDate.split("-")[2], 10);
    if (startDate === endDate) {
      return `${startDay} ${title}`;
    }
    return `${startDay}-${endDay} ${title}`;
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate || !formData.endDate) return;

    try {
      await addDoc(collection(db, "events"), formData);
      setIsAddModalOpen(false);
      setFormData({
        title: "",
        description: "",
        startDate: "",
        endDate: "",
        color: "#4f46e5",
      });
    } catch (error) {
      console.error("Error adding event: ", error);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (
      window.confirm(
        "Are you sure you want to delete this event? This cannot be undone.",
      )
    ) {
      try {
        await deleteDoc(doc(db, "events", eventId));
        setSelectedEvent(null);
      } catch (error) {
        console.error("Error deleting event: ", error);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen text-gray-800">
      {/* Upper Controls Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-white bg-[#4A154B] px-4 py-2 rounded-lg shadow">
            {monthNames[currentMonth]} {currentYear}
          </h1>
          <div className="flex bg-gray-100 rounded-lg p-1 border border-gray-200">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-white rounded transition"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-white rounded transition"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-[#4A154B] text-white font-bold px-4 py-2 rounded-lg hover:opacity-90 transition shadow"
          >
            <FiPlus /> Add Event
          </button>
        )}
      </div>

      {/* Dynamic Top Summary Section */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-8 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Activities & Events Summary
        </h2>
        {summaryEvents.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            No schedules listed for this month.
          </p>
        ) : (
          <div
            className="grid grid-flow-col gap-x-8 gap-y-2 overflow-x-auto justify-start pb-2"
            style={{
              gridTemplateRows: `repeat(${summaryRowCount}, min-content)`,
            }}
          >
            {summaryEvents.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-md cursor-pointer hover:bg-gray-100 transition w-max max-w-75"
              >
                <span
                  className="text-2xl font-bold"
                  style={{ color: event.color }}
                >
                  {getSummaryDateText(
                    event.startDate,
                    event.endDate,
                    event.title,
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Calendar Grid Container */}
      <div className="bg-white border-t border-l border-[#4A154B] rounded-t-xl shadow-sm mb-8">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-[#4A154B] text-center py-3 font-bold rounded-t-xl uppercase tracking-wider text-white">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Calendar Day Grid */}
        <div className="grid grid-cols-7 auto-rows-[100px] sm:auto-rows-[120px]">
          {Array.from({ length: firstDayIndex }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="bg-gray-50/50 border-r border-b border-[#4A154B]"
            />
          ))}

          {/* FIX: Removed full-box background colors. Events now stack as distinct clickable badges */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayEvents = getEventsForDay(day);

            return (
              <div
                key={day}
                className="p-1 sm:p-2 flex flex-col bg-white border-r border-b border-[#4A154B] hover:bg-gray-50 transition duration-150 overflow-hidden"
              >
                {/* Day Number */}
                <span className="text-xs sm:text-sm font-bold text-black self-start mb-1 shrink-0">
                  {day}
                </span>

                {/* Stacking Events Container */}
                <div
                  className="flex flex-col gap-1 w-full overflow-y-auto flex-1 pb-1"
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                >
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevents clicking the background cell from triggering anything else
                        setSelectedEvent(event);
                      }}
                      className="text-[9px] sm:text-[10px] font-bold text-white uppercase tracking-wide truncate px-1 sm:px-1.5 py-0.5 rounded shadow-sm w-full cursor-pointer hover:brightness-110 transition shrink-0"
                      style={{
                        backgroundColor: event.color,
                        textShadow: "0px 1px 2px rgba(0,0,0,0.4)", // Ensures text is readable even on bright colors
                      }}
                      title={`${event.title}${event.description ? ` - ${event.description}` : ""}`}
                    >
                      {event.title}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {Array.from({ length: endEmptyCells }).map((_, index) => (
            <div
              key={`empty-end-${index}`}
              className="bg-gray-50/50 border-r border-b border-[#4A154B]"
            />
          ))}
        </div>
      </div>

      {/* MODAL 1: Admin Add Event Screen */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative border border-gray-100">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <FiX className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FiCalendar className="text-(--color-accent)" /> Create New Event
            </h3>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Final Examination"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent)/30 focus:border-(--color-accent)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Brief Description
                </label>
                <textarea
                  rows="2"
                  placeholder="Details, venue, requirements..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent)/30 focus:border-(--color-accent) resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent)/30 focus:border-(--color-accent)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-(--color-accent)/30 focus:border-(--color-accent)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Display Theme Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-10 h-10 border border-gray-300 rounded cursor-pointer p-0.5 bg-white shrink-0"
                  />
                  <span className="text-xs font-mono text-gray-400 tracking-wider uppercase">
                    {formData.color}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-(--color-accent) text-white font-bold py-2.5 rounded-lg hover:opacity-90 transition mt-2 shadow"
              >
                Save Schedule
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Event Details Reader */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm md:max-w-2xl w-full p-6 md:p-8 relative border border-gray-100 transition-all">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
            >
              <FiX className="w-8 h-8" />
            </button>

            <div className="flex items-start gap-4 mt-1">
              <span
                className="w-5 h-5 rounded-full mt-1.5 shrink-0 shadow-sm"
                style={{ backgroundColor: selectedEvent.color }}
              />
              <div className="w-full">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                  {selectedEvent.title}
                </h3>

                <div className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-gray-400 mt-3">
                  <FiClock className="shrink-0" />
                  <span>
                    {selectedEvent.startDate} to {selectedEvent.endDate}
                  </span>
                </div>

                <div className="mt-5 pt-5 border-t border-gray-100 text-sm md:text-base text-gray-600 leading-relaxed flex gap-3">
                  <FiAlignLeft className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" />
                  <p className="whitespace-pre-line w-full">
                    {selectedEvent.description || (
                      <span className="italic text-gray-400">
                        No additional details provided.
                      </span>
                    )}
                  </p>
                </div>

                {isAdmin && (
                  <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                    <button
                      onClick={() => handleDeleteEvent(selectedEvent.id)}
                      className="flex items-center gap-1.5 text-sm font-bold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Delete Event
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
