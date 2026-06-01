import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { db, secondaryAuth } from "../firebase";
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import {
  doc,
  setDoc,
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  FiUserPlus,
  FiMail,
  FiLock,
  FiShield,
  FiUsers,
  FiTrash2,
  FiAlertTriangle,
} from "react-icons/fi";

const AddUser = () => {
  const { userRole, currentUser } = useAuth();
  const isAdmin = userRole === "admin";

  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Users List State
  const [usersList, setUsersList] = useState([]);
  const [userToDelete, setUserToDelete] = useState(null);

  // Fetch Users
  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = onSnapshot(collection(db, "users"), (snapshot) => {
      const fetchedUsers = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Sort by creation date (newest first)
      fetchedUsers.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
      setUsersList(fetchedUsers);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const handleCreateUser = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      setMessage({ text: "Unauthorized: Admins only.", type: "error" });
      return;
    }

    if (password.length < 6) {
      setMessage({
        text: "Password must be at least 6 characters.",
        type: "error",
      });
      return;
    }

    setLoading(true);
    setMessage({ text: "Creating user...", type: "loading" });

    try {
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password,
      );
      const newUserId = userCredential.user.uid;

      await setDoc(doc(db, "users", newUserId), {
        email: email.toLowerCase(),
        role: role,
        createdAt: new Date().toISOString(),
        isActive: true,
      });

      await signOut(secondaryAuth);

      setMessage({ text: "User created successfully!", type: "success" });
      setEmail("");
      setPassword("");
      setRole("teacher");
    } catch (error) {
      console.error("Error creating user:", error);
      let errorText = "Failed to create user.";
      if (error.code === "auth/email-already-in-use")
        errorText = "This email is already registered.";
      if (error.code === "auth/invalid-email")
        errorText = "Invalid email format.";

      setMessage({ text: errorText, type: "error" });
      signOut(secondaryAuth).catch(() => console.log("Cleanup catch"));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
    } catch (error) {
      console.error("Failed to update role:", error);
      alert("Error updating role.");
    }
  };

  const executeDelete = async () => {
    if (!userToDelete) return;
    try {
      // Deleting the user's Firestore document instantly revokes their portal permissions
      await deleteDoc(doc(db, "users", userToDelete.id));
      setUserToDelete(null);
    } catch (error) {
      console.error("Failed to delete user data:", error);
      alert("Error removing user access.");
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-10 text-center text-red-500 font-bold text-xl">
        Access Denied.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto relative z-10">
      <div className="mb-8 border-b pb-4 border-gray-200">
        <h1 className="text-3xl font-extrabold text-(--color-primary) flex items-center gap-3">
          <FiUsers className="w-8 h-8" /> User Management
        </h1>
        <p className="text-(--color-secondary) mt-2 text-lg">
          Register new faculty and manage existing portal access.
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full border border-gray-200">
            <div className="flex items-center gap-4 text-red-600 mb-4">
              <FiAlertTriangle className="w-10 h-10 shrink-0" />
              <h3 className="text-xl font-bold">Remove User Access?</h3>
            </div>
            <p className="text-gray-600 mb-6 font-medium">
              Are you sure you want to remove portal access for{" "}
              <strong className="text-gray-900">{userToDelete.email}</strong>?
              This action will delete their database record and instantly revoke
              their permissions.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setUserToDelete(null)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded hover:bg-gray-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* LEFT COLUMN: ADD USER FORM */}
        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-6">
            <h2 className="text-xl font-bold text-(--color-primary) flex items-center gap-2 mb-6">
              <FiUserPlus /> Register New Account
            </h2>
            <form onSubmit={handleCreateUser} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@university.edu"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Temporary Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Account Role
                </label>
                <div className="relative">
                  <FiShield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary) appearance-none bg-white font-medium"
                  >
                    <option value="teacher">Teacher</option>
                    <option value="admin">Administrator</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                    <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-(--color-primary) text-white font-bold py-3 rounded hover:brightness-110 transition disabled:opacity-50 mt-2"
              >
                {loading ? "Registering..." : "Create Account"}
              </button>

              {message.text && (
                <div
                  className={`p-4 rounded text-sm font-semibold text-center ${
                    message.type === "error"
                      ? "bg-red-50 text-red-600 border border-red-200"
                      : message.type === "success"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "text-gray-500"
                  }`}
                >
                  {message.text}
                </div>
              )}
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: USER DIRECTORY TABLE */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h2 className="text-xl font-bold text-(--color-primary)">
                Registered Accounts
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 text-sm border-b border-gray-200">
                    <th className="p-4 font-bold">Email Address</th>
                    <th className="p-4 font-bold">Role</th>
                    <th className="p-4 font-bold">Date Added</th>
                    <th className="p-4 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {usersList.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="p-6 text-center text-gray-500 font-medium"
                      >
                        Loading users...
                      </td>
                    </tr>
                  ) : (
                    usersList.map((user) => (
                      <tr
                        key={user.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-4 font-medium text-gray-900">
                          {user.email}
                        </td>
                        <td className="p-4">
                          <select
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user.id, e.target.value)
                            }
                            disabled={user.email === currentUser?.email}
                            className={`px-3 py-1.5 rounded font-bold text-sm border focus:outline-none cursor-pointer ${
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                : "bg-blue-100 text-blue-800 border-blue-200"
                            } ${user.email === currentUser?.email ? "opacity-60 cursor-not-allowed" : ""}`}
                          >
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="p-4 text-sm text-gray-600 font-medium">
                          {new Date(user.createdAt).toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {user.email === currentUser?.email ? (
                            <span className="text-xs text-gray-400 font-bold bg-gray-100 px-2 py-1 rounded">
                              Current User
                            </span>
                          ) : (
                            <button
                              onClick={() => setUserToDelete(user)}
                              className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                              title="Remove access"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddUser;
