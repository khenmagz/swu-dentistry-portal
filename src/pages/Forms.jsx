import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { Link } from "react-router-dom";

// --- CONFIGURATION ---
const CLOUDINARY_CLOUD_NAME = "damg32ari";
const CLOUDINARY_UPLOAD_PRESET = "school_portal_preset";
const MAX_FILE_SIZE_MB = 10;
// ---------------------

const Forms = () => {
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";

  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Upload States
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  // 1. Fetch forms from Firebase
  useEffect(() => {
    const q = query(collection(db, "forms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedForms = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setForms(fetchedForms);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Handle Form Upload (Admin Only)
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !title) {
      setMessage("Please provide a title and select a file.");
      return;
    }

    const fileSizeInMB = selectedFile.size / (1024 * 1024);
    if (fileSizeInMB > MAX_FILE_SIZE_MB) {
      setMessage(
        `Error: File is too large. Max size is ${MAX_FILE_SIZE_MB}MB.`,
      );
      return;
    }

    setUploading(true);
    setMessage("Uploading form...");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
        { method: "POST", body: formData },
      );
      const uploadedFile = await res.json();

      if (uploadedFile.secure_url) {
        await addDoc(collection(db, "forms"), {
          title: title,
          url: uploadedFile.secure_url,
          filename: selectedFile.name,
          createdAt: new Date().toISOString(),
        });

        setMessage("Form uploaded successfully!");
        setTitle("");
        setSelectedFile(null);
        setTimeout(() => setMessage(""), 3000);
      } else {
        throw new Error(uploadedFile.error?.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage("Upload failed. Please check your connection.");
    } finally {
      setUploading(false);
    }
  };

  // 3. Handle Delete (Admin Only)
  const handleDelete = async (id, formTitle) => {
    if (!window.confirm(`Are you sure you want to delete the "${formTitle}"?`))
      return;
    try {
      await deleteDoc(doc(db, "forms", id));
    } catch (error) {
      console.error("Error deleting form:", error);
      alert("Failed to delete the form.");
    }
  };

  if (loading)
    return (
      <div className="p-6 text-(--color-secondary)">
        Loading forms directory...
      </div>
    );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-(--color-primary)">
          Forms Directory
        </h1>
        {isAdmin && (
          <span className="bg-(--color-accent) text-(--color-background) px-3 py-1 rounded text-sm">
            Admin Control
          </span>
        )}
      </div>

      {/* ADMIN UPLOAD SECTION */}
      {isAdmin && (
        <div className="bg-(--color-surface) p-6 rounded shadow mb-8 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-(--color-primary)">
            Upload New Form
          </h2>

          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Form Title (e.g., Registration Form)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              className="p-3 border border-gray-300 rounded focus:outline-none focus:border-(--color-primary)"
              required
            />

            {/* DRAG & DROP ZONE */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0])
                  setSelectedFile(e.dataTransfer.files[0]);
              }}
              className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer text-center ${
                isDragging
                  ? "border-(--color-primary) bg-gray-50"
                  : "border-gray-300 bg-(--color-background) hover:border-(--color-primary)"
              }`}
            >
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg,image/jpg"
                disabled={uploading}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0])
                    setSelectedFile(e.target.files[0]);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
              />
              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <span className="text-3xl mb-2">📄</span>
                  <p className="text-(--color-primary) font-semibold">
                    Selected: {selectedFile.name}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-3">📁</span>
                  <p className="text-(--color-primary) font-semibold mb-1">
                    Click to upload or drag PDF/Image here
                  </p>
                  <p className="text-xs text-(--color-secondary)">
                    Accepted formats: .pdf, .jpg, .png (Max: {MAX_FILE_SIZE_MB}
                    MB)
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="bg-(--color-primary) text-(--color-background) px-6 py-3 rounded shadow hover:opacity-90 transition font-semibold disabled:opacity-50"
            >
              {uploading ? "Uploading..." : "Upload Form"}
            </button>
            {message && (
              <p className="text-sm font-medium mt-2 text-(--color-accent)">
                {message}
              </p>
            )}
          </form>
        </div>
      )}

      {/* FORMS DIRECTORY LIST */}
      <div className="bg-(--color-background) p-6 rounded shadow border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-(--color-primary)">
          Available Forms
        </h2>
        {forms.length === 0 ? (
          <p className="text-(--color-secondary)">
            No forms have been uploaded yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {forms.map((form) => (
              <li
                key={form.id}
                className="flex justify-between items-center p-4 border border-gray-200 rounded hover:bg-gray-50 transition"
              >
                <div>
                  <h3 className="font-semibold text-lg text-(--color-primary)">
                    {form.title}
                  </h3>
                  <p className="text-xs text-(--color-secondary)">
                    Added: {new Date(form.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* This link will point to our new FormView page! */}
                  <Link
                    to={`/forms/${form.id}`}
                    className="bg-(--color-primary) text-(--color-background) px-4 py-2 rounded hover:opacity-90 transition text-sm font-semibold"
                  >
                    View Form
                  </Link>

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(form.id, form.title)}
                      className="text-(--color-accent) text-sm font-semibold hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Forms;
