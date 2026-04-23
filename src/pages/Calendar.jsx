import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

// --- CONFIGURATION ---
const CLOUDINARY_CLOUD_NAME = "damg32ari";
const CLOUDINARY_UPLOAD_PRESET = "school_portal_preset";
const MAX_FILE_SIZE_MB = 10;
// ---------------------

const Calendar = () => {
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";

  const [calendarData, setCalendarData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async () => {
    try {
      const docRef = doc(db, "settings", "schoolCalendar");
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setCalendarData(data.current || null);
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error("Error fetching calendar:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // --- NEW: FILE SIZE VALIDATION ---
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > MAX_FILE_SIZE_MB) {
      setMessage(
        `Error: File is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`,
      );
      return;
    }
    // ---------------------------------

    setUploading(true);
    setMessage("Uploading to Cloudinary...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: "POST",
          body: formData,
        },
      );
      const uploadedFile = await res.json();

      if (uploadedFile.secure_url) {
        const newCalendar = {
          url: uploadedFile.secure_url,
          filename: file.name,
          dateAdded: new Date().toISOString(),
        };

        await saveToFirebase(newCalendar);
      } else {
        throw new Error(uploadedFile.error?.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Upload failed. Check file type or connection.");
    } finally {
      setUploading(false);
    }
  };

  const saveToFirebase = async (newCalendar) => {
    setMessage("Saving to database...");
    try {
      let updatedHistory = [];

      if (calendarData) {
        updatedHistory = [calendarData];
      }

      await setDoc(doc(db, "settings", "schoolCalendar"), {
        current: newCalendar,
        history: updatedHistory,
      });

      setCalendarData(newCalendar);
      setHistory(updatedHistory);
      setMessage("Calendar updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Firebase error:", error);
      setMessage("Failed to save to database.");
    }
  };

  const handleRestore = async (historicalCalendar) => {
    if (
      !window.confirm(
        "Are you sure you want to revert to this previous calendar?",
      )
    )
      return;
    await saveToFirebase(historicalCalendar);
  };

  const isPdf = calendarData?.url?.toLowerCase().includes(".pdf");

  if (loading) {
    return (
      <div className="p-6 text-(--color-secondary)">Loading calendar...</div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-(--color-primary)">
          School Calendar
        </h1>
      </div>

      {/* ADMIN CONTROLS */}
      {isAdmin && (
        <div className="bg-(--color-surface) p-6 rounded shadow mb-8">
          <h2 className="text-lg font-semibold mb-4 text-(--color-primary)">
            Upload New Calendar
          </h2>

          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg,image/jpg"
              onChange={handleFileUpload}
              disabled={uploading}
              className="block w-full text-sm text-(--color-secondary)
                file:mr-4 file:py-2 file:px-4
                file:rounded file:border-0
                file:text-sm file:font-semibold
                file:bg-(--color-primary) file:text-(--color-background)
                hover:file:opacity-90 cursor-pointer"
            />
            {/* NEW: HELPER TEXT FOR ADMIN */}
            <p className="text-xs text-gray-500 italic">
              Accepted formats: .pdf, .jpg, .png (Maximum size: 10MB)
            </p>
          </div>

          {uploading && (
            <p className="mt-3 text-sm text-(--color-secondary)">
              Please wait, uploading...
            </p>
          )}
          {message && !uploading && (
            <p className="mt-3 text-sm font-medium text-(--color-accent)">
              {message}
            </p>
          )}

          {/* HISTORY SECTION */}
          {history.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-300">
              <h3 className="text-sm font-semibold mb-2 text-(--color-secondary)">
                Previous Version:
              </h3>
              <ul className="text-sm space-y-2">
                {history.map((item, index) => (
                  <li
                    key={index}
                    className="flex justify-between items-center bg-(--color-background) p-2 rounded border border-gray-200"
                  >
                    <span className="truncate w-2/3">
                      {item.filename} (
                      {new Date(item.dateAdded).toLocaleDateString()})
                    </span>
                    <button
                      onClick={() => handleRestore(item)}
                      className="text-(--color-accent) hover:underline text-xs font-bold"
                    >
                      Restore Previous
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* CALENDAR DISPLAY */}
      <div className="flex flex-col items-center">
        <div className="w-full bg-(--color-background) p-4 shadow rounded min-h-125 flex flex-col items-center justify-center border border-gray-200 mb-6">
          {!calendarData ? (
            <p className="text-(--color-secondary)">
              No calendar has been uploaded yet.
            </p>
          ) : (
            <>
              {/* NEW: PREVIEW LABEL IF IT IS A PDF */}
              {isPdf && (
                <p className="text-sm font-semibold text-(--color-secondary) mb-3">
                  Document Preview (Page 1)
                </p>
              )}

              <img
                src={calendarData.url.replace(".pdf", ".jpg")}
                alt="School Calendar"
                className="max-w-full h-auto rounded object-contain shadow-sm border border-gray-300"
              />
            </>
          )}
        </div>

        {/* DOWNLOAD BUTTON */}
        {/* The Bulletproof Fallback */}
        {calendarData && (
          <a
            href={calendarData.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-(--color-primary) text-(--color-background) px-8 py-3 rounded shadow hover:opacity-90 transition font-semibold mt-4 text-center inline-block"
          >
            Open Full Calendar
          </a>
        )}
      </div>
    </div>
  );
};

export default Calendar;
