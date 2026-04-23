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

// --- CONFIGURATION ---
const CLOUDINARY_CLOUD_NAME = "damg32ari"; // Your Cloud Name
const CLOUDINARY_UPLOAD_PRESET = "school_portal_preset"; // Your Preset
const MAX_VIDEO_SIZE_MB = 100; // Cloudinary free tier limit for videos
// ---------------------

const Tutorials = () => {
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  // Upload States
  const [title, setTitle] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  // 1. Fetch videos from Firebase in real-time
  useEffect(() => {
    // We order them by newest first
    const q = query(collection(db, "tutorials"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedVideos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVideos(fetchedVideos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Handle Video Upload (Admin Only)
  const handleUpload = async (e) => {
    e.preventDefault();
    const file = selectedFile;

    if (!file || !title) {
      setMessage("Please provide a title and select a video.");
      return;
    }

    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > MAX_VIDEO_SIZE_MB) {
      setMessage(
        `Error: Video is too large. Max size is ${MAX_VIDEO_SIZE_MB}MB.`,
      );
      return;
    }

    setUploading(true);
    setMessage("Uploading video... This may take a minute.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      // Note: We use /video/upload for video files
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
        {
          method: "POST",
          body: formData,
        },
      );
      const uploadedFile = await res.json();

      if (uploadedFile.secure_url) {
        // Optimize the URL to save bandwidth (q_auto)
        // Changes standard URL to highly compressed auto-quality URL
        const optimizedUrl = uploadedFile.secure_url.replace(
          "/upload/",
          "/upload/q_auto/",
        );

        // Save to Firebase
        await addDoc(collection(db, "tutorials"), {
          title: title,
          url: optimizedUrl,
          filename: file.name,
          createdAt: new Date().toISOString(),
        });

        setMessage("Video uploaded successfully!");
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
  const handleDelete = async (id, videoTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${videoTitle}"?`))
      return;

    try {
      await deleteDoc(doc(db, "tutorials", id));
      // Note: Like the PDF, this removes it from the app. It stays in Cloudinary unless manually deleted there.
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("Failed to delete the video.");
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-(--color-secondary)">Loading tutorials...</div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-(--color-primary)">Tutorials</h1>
        {isAdmin && (
          <span className="bg-(--color-accent) text-(--color-background) px-3 py-1 rounded text-sm">
            Admin Control
          </span>
        )}
      </div>

      {/* ADMIN UPLOAD SECTION */}
      {isAdmin && (
        <div className="bg-(--color-surface) p-6 rounded shadow mb-8 border border-gray-200   ">
          <h2 className="text-lg font-semibold mb-2 text-(--color-primary)">
            Upload New Tutorial
          </h2>
          <p className="text-sm text-(--color-secondary) mb-4">
            Accepted formats: .mp4, .webm (Maximum size: {MAX_VIDEO_SIZE_MB}MB)
          </p>

          <form
            onSubmit={handleUpload}
            className="flex flex-col gap-4 max-w-2xl"
          >
            <input
              type="text"
              placeholder="Video Title (e.g., How to submit grades)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={uploading}
              className="p-2 border border-gray-300 rounded focus:outline-none focus:border-(--color-primary)"
              required
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                // Grab only the first file dropped
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  setSelectedFile(e.dataTransfer.files[0]);
                }
              }}
              className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg transition-colors cursor-pointer text-center ${
                isDragging
                  ? "border-(--color-primary) bg-gray-50"
                  : "border-gray-300 bg-(--color-background) hover:border-(--color-primary)"
              }`}
            >
              {/* Invisible input that covers the whole box for clicking */}
              <input
                type="file"
                accept="video/mp4,video/webm"
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
                  <p className="text-xs text-(--color-accent) mt-1">
                    (Click or drag a different file to change)
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-3">📁</span>
                  <p className="text-(--color-primary) font-semibold mb-1">
                    Click to upload or drag video here
                  </p>
                  <p className="text-xs text-(--color-secondary)">
                    Accepted formats: .mp4, .webm (Max: {MAX_VIDEO_SIZE_MB}MB)
                  </p>
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={uploading || !selectedFile} // Disables if no file is selected
              className="bg-(--color-primary) text-(--color-background) px-6 py-3 rounded shadow hover:opacity-90 transition font-semibold disabled:opacity-50 mt-2"
            >
              {uploading ? "Uploading..." : "Upload Video"}
            </button>

            {message && (
              <p
                className={`text-sm font-medium ${message.includes("Error") || message.includes("failed") ? "text-(--color-accent)" : "text-green-600"}`}
              >
                {message}
              </p>
            )}
          </form>
        </div>
      )}

      {/* VIDEO GRID DISPLAY */}
      {videos.length === 0 ? (
        <div className="bg-(--color-background) p-10 text-center rounded shadow border border-gray-200">
          <p className="text-(--color-secondary)">
            No tutorials have been uploaded yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-(--color-background) rounded shadow border border-gray-200 overflow-hidden flex flex-col"
            >
              {/* VIDEO PLAYER */}
              <div className="relative bg-black aspect-video w-full">
                <video
                  controls
                  preload="none"
                  controlsList="nodownload" // Hides download button
                  onContextMenu={(e) => e.preventDefault()} // Disables right click
                  poster={video.url.replace(/\.(mp4|webm)/g, ".jpg")} // Highly compressed thumbnail trick
                  className="w-full h-full object-contain"
                >
                  <source src={video.url} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>

              {/* VIDEO DETAILS */}
              <div className="p-4 flex flex-col grow justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg text-(--color-primary) mb-1 leading-tight">
                    {video.title}
                  </h3>
                  <p className="text-xs text-(--color-secondary)">
                    Added: {new Date(video.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* ADMIN DELETE BUTTON */}
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(video.id, video.title)}
                    className="self-end text-sm text-(--color-accent) font-semibold hover:underline"
                  >
                    Delete Video
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tutorials;
