import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

// --- CONFIGURATION ---
const CLOUDINARY_CLOUD_NAME = "damg32ari";
const CLOUDINARY_UPLOAD_PRESET = "school_portal_preset";
// ---------------------

const OrganizationalChart = () => {
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";

  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Upload States
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  // 1. Fetch the SINGLE chart document in real-time
  useEffect(() => {
    // We look for one specific document named "main" inside the "orgChart" collection
    const docRef = doc(db, "orgChart", "main");

    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setChartData(docSnap.data());
      } else {
        setChartData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Handle Upload & Replace (Admin Only)
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setMessage("Uploading and replacing chart...");

    const formData = new FormData();
    formData.append("file", selectedFile);
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
        // setDoc OVERWRITES the "main" document. No duplicates!
        await setDoc(doc(db, "orgChart", "main"), {
          url: uploadedFile.secure_url,
          updatedAt: new Date().toISOString(),
        });

        setMessage("Chart successfully updated!");
        setSelectedFile(null);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (loading)
    return (
      <div className="p-6 text-(--color-secondary)">
        Loading Organizational Chart...
      </div>
    );

  // Magic trick: If it's a PDF, we force it to show as a .jpg image anyway!
  const displayUrl = chartData?.url.includes(".pdf")
    ? chartData.url.replace(".pdf", ".jpg")
    : chartData?.url;

  return (
    <div className="p-6 max-w-5xl mx-auto relative z-10">
      <div className="mb-8 border-b pb-4 border-gray-200">
        <h1 className="text-3xl font-bold text-(--color-primary)">
          Organizational Chart
        </h1>
        <p className="text-(--color-secondary) mt-1">
          Structure of the Dentistry Department.
        </p>
      </div>

      {/* ADMIN UPLOAD SECTION */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-(--color-primary)/20 mb-8">
          <h2 className="text-lg font-bold mb-4 text-(--color-primary)">
            Update Chart
          </h2>
          <form
            onSubmit={handleUpload}
            className="flex flex-col md:flex-row gap-4 items-center"
          >
            <input
              type="file"
              accept=".pdf,image/png,image/jpeg"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              required
              className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-(--color-primary) hover:file:bg-gray-200 cursor-pointer border border-gray-300 p-2 rounded w-full"
            />
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="bg-(--color-primary) text-white px-8 py-3 rounded shadow hover:opacity-90 transition font-bold disabled:opacity-50 whitespace-nowrap w-full md:w-auto"
            >
              {uploading ? "Updating..." : "Replace Chart"}
            </button>
          </form>
          {message && (
            <p className="text-sm mt-3 text-teal-600 font-semibold">
              {message}
            </p>
          )}
        </div>
      )}

      {/* CHART DISPLAY */}
      {!chartData ? (
        <div className="text-center p-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <p className="text-(--color-secondary)">
            The organizational chart has not been uploaded yet.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col items-center">
          <p className="text-xs text-gray-400 w-full text-right mb-2">
            Last updated: {new Date(chartData.updatedAt).toLocaleDateString()}
          </p>

          {/* THE "NOT DOWNLOADABLE" IMAGE TRICK */}
          <img
            src={displayUrl}
            alt="Organizational Chart"
            onContextMenu={(e) => e.preventDefault()} // Disables Right-Click
            className="max-w-full h-auto rounded shadow-sm border border-gray-100 pointer-events-none" // pointer-events-none disables drag-to-desktop
          />
        </div>
      )}
    </div>
  );
};

export default OrganizationalChart;
