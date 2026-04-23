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
import { FiSearch, FiUsers, FiTrash2, FiExternalLink } from "react-icons/fi";

// --- CONFIGURATION ---
const CLOUDINARY_CLOUD_NAME = "damg32ari";
const CLOUDINARY_UPLOAD_PRESET = "school_portal_preset";
const MAX_FILE_SIZE_MB = 10;
const ITEMS_PER_PAGE = 6;
// ---------------------

const StudentList = () => {
  const { currentUser, userRole } = useAuth();
  const isAdmin = userRole === "admin";

  const [studentLists, setStudentLists] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Upload States
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  // 1. Fetch from the "studentLists" collection
  useEffect(() => {
    const q = query(
      collection(db, "studentLists"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStudentLists(fetched);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. SEARCH & PAGINATION LOGIC
  const filteredLists = studentLists.filter((item) =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredLists.length / ITEMS_PER_PAGE);
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredLists.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 3. Handle Upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile || !title) {
      setMessage("Please provide a title and select a file.");
      return;
    }

    const fileSizeInMB = selectedFile.size / (1024 * 1024);
    if (fileSizeInMB > MAX_FILE_SIZE_MB) {
      setMessage(`Error: File is too large.`);
      return;
    }

    setUploading(true);
    setMessage("Uploading roster...");

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
        await addDoc(collection(db, "studentLists"), {
          title: title,
          url: uploadedFile.secure_url,
          filename: selectedFile.name,
          createdAt: new Date().toISOString(),
        });

        setMessage("Roster uploaded successfully!");
        setTitle("");
        setSelectedFile(null);
        setTimeout(() => setMessage(""), 3000);
      }
    } catch (error) {
      setMessage("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // 4. Handle Delete
  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    await deleteDoc(doc(db, "studentLists", id));
  };

  if (loading)
    return (
      <div className="p-6 text-(--color-secondary)">
        Loading student lists...
      </div>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto relative z-10">
      {/* HEADER & SEARCH BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-(--color-primary)">
            List of Students
          </h1>
          <p className="text-(--color-secondary) mt-1">
            Official class rosters and student directories.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by section or year..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary) shadow-sm"
          />
        </div>
      </div>

      {/* ADMIN UPLOAD SECTION */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-(--color-primary)/20 mb-8">
          <h2 className="text-lg font-bold mb-4 text-(--color-primary)">
            Upload New Roster
          </h2>
          <form
            onSubmit={handleUpload}
            className="flex flex-col md:flex-row gap-4 items-start"
          >
            <div className="flex-1 w-full flex flex-col gap-3">
              <input
                type="text"
                placeholder="Title (e.g., 1st Year - Section A Roster)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="p-3 border border-gray-300 rounded focus:outline-none focus:border-(--color-primary)"
              />
              <input
                type="file"
                accept=".pdf,image/png,image/jpeg"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                required
                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-(--color-primary) hover:file:bg-gray-200 cursor-pointer border border-gray-300 p-2 rounded"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="bg-(--color-primary) text-white px-8 py-3 rounded shadow hover:opacity-90 transition font-bold disabled:opacity-50 h-full min-h-12.5"
            >
              {uploading ? "Uploading..." : "Post Roster"}
            </button>
          </form>
          {message && (
            <p className="text-sm mt-3 text-teal-600 font-semibold">
              {message}
            </p>
          )}
        </div>
      )}

      {/* DOCUMENT GRID */}
      {currentItems.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <FiUsers className="mx-auto text-4xl text-gray-300 mb-3" />
          <p className="text-(--color-secondary)">No student lists found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col group"
            >
              <div className="bg-gray-100 aspect-3/4 w-full border-b border-gray-200 relative overflow-hidden flex items-center justify-center p-4">
                <img
                  src={item.url.replace(".pdf", ".jpg")}
                  alt={item.title}
                  className="max-w-full max-h-full object-contain shadow-sm border border-gray-300 group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white text-(--color-primary) px-4 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-gray-100 transform translate-y-4 group-hover:translate-y-0 transition-all"
                  >
                    <FiExternalLink /> Open Roster
                  </a>
                </div>
              </div>

              <div className="p-4 flex flex-col grow justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 leading-tight mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    Posted: {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-(--color-primary) hover:underline flex items-center gap-1"
                  >
                    View / Download
                  </a>

                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      className="text-gray-400 hover:text-red-500 transition"
                      title="Delete"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-10">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-semibold disabled:opacity-50 hover:bg-gray-50 transition"
          >
            Previous
          </button>
          <span className="text-sm font-medium text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-gray-300 rounded text-sm font-semibold disabled:opacity-50 hover:bg-gray-50 transition"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentList;
