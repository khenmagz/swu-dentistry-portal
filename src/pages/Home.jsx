import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../firebase";
import { FiSend, FiTrash2 } from "react-icons/fi";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
} from "firebase/firestore";

// --- CONFIGURATION ---
const CLOUDINARY_CLOUD_NAME = "damg32ari";
const CLOUDINARY_UPLOAD_PRESET = "school_portal_preset";
// ---------------------

// ==========================================
// COMPONENT 1: The Individual Post Card
// ==========================================

const AnnouncementCard = ({ post, currentUser, isAdmin }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [lastVisible, setLastVisible] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    const fetchInitialComments = async () => {
      if (!post.allowComments) return;
      const q = query(
        collection(db, "announcements", post.id, "comments"),
        orderBy("createdAt", "desc"),
        limit(3),
      );
      const snapshot = await getDocs(q);
      const fetchedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(fetchedComments);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      if (snapshot.docs.length < 3) setHasMore(false);
    };
    fetchInitialComments();
  }, [post.id, post.allowComments]);

  const loadMoreComments = async () => {
    if (!lastVisible) return;
    setLoadingComments(true);
    try {
      const q = query(
        collection(db, "announcements", post.id, "comments"),
        orderBy("createdAt", "desc"),
        startAfter(lastVisible),
        limit(3),
      );
      const snapshot = await getDocs(q);
      const fetchedComments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments((prev) => [...prev, ...fetchedComments]);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      if (snapshot.docs.length < 3) setHasMore(false);
    } catch (error) {
      console.error("Error loading more comments:", error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const commentData = {
        email: currentUser?.email,
        text: newComment,
        createdAt: new Date().toISOString(),
      };
      const docRef = await addDoc(
        collection(db, "announcements", post.id, "comments"),
        commentData,
      );
      setComments([{ id: docRef.id, ...commentData }, ...comments]);
      setNewComment("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteDoc(doc(db, "announcements", post.id, "comments", commentId));
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm("Delete this entire announcement?")) return;
    try {
      await deleteDoc(doc(db, "announcements", post.id));
    } catch (error) {
      console.error("Error deleting post:", error);
    }
  };

  return (
    // 1. THE MAIN CONTAINER: 95% opaque white. It reads as solid, but lets just a tiny fraction
    // of the background bleed through so it doesn't look like a harsh "sticker" on the page.
    <div className="bg-white/70 rounded-b-4xl shadow-md mb-10 overflow-hidden border border-gray-200">
      {/* 2. STRUCTURED HEADER: Uses a thick left accent line instead of a background color */}
      <div className="px-6 pt-6 pb-4 border-b bg-gray-100 border-gray-100 flex justify-between items-start">
        <div className="border-l-4 border-(--color-primary) pl-4">
          <h3 className="font-extrabold text-gray-900 text-xl uppercase tracking-wide">
            {post.title || "Admin Announcement"}
          </h3>
          <p className="text-sm text-gray-500 font-medium mt-1">
            {new Date(post.createdAt).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={handleDeletePost}
            className="text-xs font-bold text-gray-400 hover:text-red-600 transition px-2 py-1 border border-transparent hover:border-red-200 rounded"
          >
            Delete
          </button>
        )}
      </div>

      {/* POST BODY */}
      <div className="px-6 py-6 w-full overflow-hidden">
        <div
          className="text-gray-800 text-md leading-relaxed w-full wrap-break-word 
               **:bg-transparent! 
               [&_p]:bg-transparent!
               [&_span]:bg-transparent!
               [&_p]:mb-4 last:[&_p]:mb-0 [&_p]:min-h-6
               [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4
               [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-4
               [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-3
               [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3
               [&_a]:text-(--color-primary) [&_a]:underline [&_a]:font-semibold"
          dangerouslySetInnerHTML={{ __html: post.text }}
        />

        {/* ATTACHMENT DISPLAY */}
        {post.fileUrl && (
          <div className="mt-6 border border-gray-200 rounded-lg p-3 bg-white flex flex-col items-start sm:flex-row sm:items-center gap-4 shadow-sm">
            {post.fileUrl.includes(".pdf") ? (
              <img
                src={post.fileUrl.replace(".pdf", ".jpg")}
                alt="Document"
                className="w-16 h-16 object-cover rounded border border-gray-200"
              />
            ) : (
              <img
                src={post.fileUrl}
                alt="Attachment"
                className="w-16 h-16 object-cover rounded border border-gray-200"
              />
            )}
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Attached Document
              </p>
              <a
                href={post.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-(--color-primary) font-bold hover:underline mt-1 inline-block"
              >
                View Attachment &rarr;
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 3. STRUCTURED COMMENTS ZONE: Shifted background color to separate it from the main post */}
      {post.allowComments && (
        <div className="bg-gray-50/80 px-6 py-6 border-t border-gray-200">
          {hasMore && comments.length >= 3 && (
            <button
              onClick={loadMoreComments}
              disabled={loadingComments}
              className="text-sm font-semibold text-(--color-primary) hover:underline mb-6 block w-full text-left"
            >
              {loadingComments ? "Loading..." : "View previous comments"}
            </button>
          )}

          <div className="flex flex-col-reverse gap-3 mb-6">
            {comments.map((comment) => {
              const displayName = comment.email.split("@")[0];
              const isCommentOwner = currentUser?.email === comment.email;
              const commentDate = new Date(
                comment.createdAt,
              ).toLocaleDateString([], { month: "short", day: "numeric" });
              const commentTime = new Date(
                comment.createdAt,
              ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

              return (
                // 4. DISTINCT COMMENT BOXES: Each comment is a structured card of its own
                <div
                  key={comment.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex gap-3 shadow-sm group relative"
                >
                  <div className="w-8 h-8 rounded bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-bold text-sm text-gray-900">
                        {displayName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {commentDate} • {commentTime}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800">{comment.text}</p>
                  </div>

                  {(isAdmin || isCommentOwner) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition bg-white p-1 rounded"
                      title="Delete comment"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* 5. STRUCTURED INPUT: A solid, recognizable box, not a pill */}
          <form
            onSubmit={handleAddComment}
            className="flex gap-3 items-start bg-white border border-gray-300 rounded-lg p-2 focus-within:border-(--color-primary) focus-within:ring-1 focus-within:ring-(--color-primary) transition shadow-sm"
          >
            <div className="w-8 h-8 rounded bg-(--color-primary) text-white flex items-center justify-center font-bold text-sm shrink-0">
              {currentUser?.email.charAt(0).toUpperCase()}
            </div>

            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 text-sm focus:outline-none bg-transparent text-gray-800 py-1.5 px-1"
            />
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="bg-gray-100 hover:bg-(--color-primary) hover:text-white text-gray-500 disabled:opacity-50 disabled:hover:bg-gray-100 disabled:hover:text-gray-500 p-2 rounded transition"
            >
              <FiSend size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

// ==========================================
// COMPONENT 2: The Main Home Feed
// ==========================================
const Home = () => {
  const { currentUser, userRole } = useAuth();
  const isAdmin = userRole === "admin";
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. LOGIC FIX: Added a state for the title
  const [title, setTitle] = useState("");
  const [postText, setPostText] = useState("");
  const [allowComments, setAllowComments] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "announcements"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    const plainText = postText.replace(/<[^>]+>/g, "").trim();

    // Check if they entered a title
    if (!title.trim()) {
      setMessage("Please enter a title for your announcement.");
      return;
    }

    if (!plainText && !selectedFile) {
      setMessage("Please add text or an attachment.");
      return;
    }

    setUploading(true);
    setMessage("Posting announcement...");

    let fileUrl = null;
    let fileName = null;

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
          { method: "POST", body: formData },
        );
        const uploadedFile = await res.json();

        if (uploadedFile.secure_url) {
          fileUrl = uploadedFile.secure_url;
          fileName = selectedFile.name;
        } else {
          throw new Error("File upload failed");
        }
      }

      // 3. LOGIC FIX: Save the title to the database
      await addDoc(collection(db, "announcements"), {
        title: title,
        text: postText,
        fileUrl: fileUrl,
        fileName: fileName,
        allowComments: allowComments,
        createdAt: new Date().toISOString(),
      });

      // Clear all fields
      setTitle("");
      setPostText("");
      setSelectedFile(null);
      setAllowComments(true);
      setMessage("Posted successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Posting error:", error);
      setMessage("Failed to post.");
    } finally {
      setUploading(false);
    }
  };

  if (loading)
    return (
      <div className="p-6 text-(--color-secondary) text-center mt-10">
        Loading announcements...
      </div>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-(--color-primary)">
          Announcement
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Stay updated with the latest school announcements.
        </p>
      </div>

      {isAdmin && (
        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-(--color-primary) mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Create Announcement
          </h2>
          <form onSubmit={handleCreatePost}>
            {/* 4. UI FIX: New Title Input Field */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement Title (e.g., New Registration Rule!)"
              className="w-full mb-4 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary) focus:border-transparent outline-none transition font-medium"
              required
            />

            <div className="mb-14 bg-white rounded-lg shadow-inner [&_.ql-editor]:min-h-37.5 [&_.ql-toolbar]:rounded-t-lg [&_.ql-container]:rounded-b-lg">
              <ReactQuill
                theme="snow"
                value={postText}
                onChange={setPostText}
                placeholder="Type the details of your announcement here..."
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
              <div className="flex flex-col gap-3">
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-(--color-primary) file:text-white hover:file:bg-opacity-90 cursor-pointer"
                />

                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(e) => setAllowComments(e.target.checked)}
                    className="accent-(--color-primary) w-4 h-4"
                  />
                  Allow class comments
                </label>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="bg-(--color-primary) text-white px-8 py-2.5 rounded-full shadow-md font-bold hover:brightness-110 transition disabled:opacity-50"
              >
                {uploading ? "Posting..." : "Post Announcement"}
              </button>
            </div>
            {message && (
              <p
                className={`text-sm font-bold mt-4 ${message.includes("success") ? "text-green-600" : "text-(--color-accent)"}`}
              >
                {message}
              </p>
            )}
          </form>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center p-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500 font-medium">
            No announcements have been posted yet.
          </p>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <AnnouncementCard
              key={post.id}
              post={post}
              currentUser={currentUser}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
