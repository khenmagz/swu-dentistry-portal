import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { db, secondaryAuth } from "../firebase"; // Import the ghost auth!
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { FiUserPlus, FiMail, FiLock, FiShield } from "react-icons/fi";

const AddUser = () => {
  const { userRole } = useAuth();
  const isAdmin = userRole === "admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher"); // Default role

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleCreateUser = async (e) => {
    e.preventDefault();

    // Security check: Only admins can do this
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
      // 1. Create the user using the SECONDARY Auth instance
      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password,
      );
      const newUserId = userCredential.user.uid;

      // 2. Save their Role and Details to Firestore
      // We use setDoc instead of addDoc so the document ID exactly matches their Auth UID!
      await setDoc(doc(db, "users", newUserId), {
        email: email.toLowerCase(),
        role: role,
        createdAt: new Date().toISOString(),
        isActive: true, // Good industry practice: allows you to ban/deactivate users later
      });

      // 3. SECURE CLEANUP: Sign out the secondary instance immediately
      await signOut(secondaryAuth);

      setMessage({ text: "User created successfully!", type: "success" });
      setEmail("");
      setPassword("");
      setRole("teacher"); // Reset to default
    } catch (error) {
      console.error("Error creating user:", error);
      // Clean up Firebase error messages for the UI
      let errorText = "Failed to create user.";
      if (error.code === "auth/email-already-in-use")
        errorText = "This email is already registered.";
      if (error.code === "auth/invalid-email")
        errorText = "Invalid email format.";

      setMessage({ text: errorText, type: "error" });

      // Safety cleanup just in case it partially succeeded
      signOut(secondaryAuth).catch(() => console.log("Cleanup catch"));
    } finally {
      setLoading(false);
    }
  };

  // If a standard teacher accidentally navigates here, block them
  if (!isAdmin) {
    return (
      <div className="p-10 text-center text-red-500 font-bold">
        Access Denied.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto relative z-10">
      <div className="mb-8 border-b pb-4 border-gray-200">
        <h1 className="text-3xl font-bold text-(--color-primary) flex items-center gap-3">
          <FiUserPlus /> Manage Access
        </h1>
        <p className="text-(--color-secondary) mt-1">
          Register new faculty and administrators.
        </p>
      </div>

      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
        <form onSubmit={handleCreateUser} className="space-y-6">
          {/* Email Input */}
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
                placeholder="teacher@swu.edu.ph"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary)"
              />
            </div>
          </div>

          {/* Password Input */}
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

          {/* Role Dropdown */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              Account Role
            </label>
            <div className="relative">
              <FiShield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded focus:outline-none focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary) appearance-none bg-white"
              >
                <option value="teacher">Teacher (Standard Access)</option>
                <option value="admin">Administrator (Full Access)</option>
              </select>
              {/* Custom dropdown arrow for better UI */}
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                <svg
                  className="fill-current h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-(--color-primary) text-white font-bold py-3 rounded shadow hover:opacity-90 transition disabled:opacity-50 mt-4"
          >
            {loading ? "Registering..." : "Create Account"}
          </button>

          {/* Status Messages */}
          {message.text && (
            <div
              className={`p-4 rounded text-sm font-semibold text-center ${
                message.type === "error"
                  ? "bg-red-50 text-red-600 border border-red-200"
                  : message.type === "success"
                    ? "bg-green-50 text-green-600 border border-green-200"
                    : "text-gray-500"
              }`}
            >
              {message.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddUser;
