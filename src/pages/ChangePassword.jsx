import { useState } from "react";
import { auth } from "../firebase";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      return setError("New password must be at least 6 characters.");
    }
    if (newPassword !== confirmPassword) {
      return setError("New passwords do not match.");
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );

      // Re-authenticate user before changing password for security
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setError(
        "Failed to update password. Please verify your current password is correct.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 bg-(--color-surface) p-8 rounded-lg shadow-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-(--color-primary) mb-6 text-center">
        Change Password
      </h2>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 mb-4 text-sm font-medium">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-(--color-primary) mb-1">
            Current Password
          </label>
          <input
            type="password"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary)"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-(--color-primary) mb-1">
            New Password{" "}
            <span className="font-normal text-gray-500">(Min. 6 chars)</span>
          </label>
          <input
            type="password"
            required
            minLength="6"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-(--color-primary) mb-1">
            Confirm New Password
          </label>
          <input
            type="password"
            required
            minLength="6"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary)"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 bg-(--color-primary) text-white font-bold py-2.5 px-4 rounded hover:opacity-90 transition disabled:opacity-70 flex justify-center"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Updating...
            </span>
          ) : (
            "Save New Password"
          )}
        </button>
      </form>
    </div>
  );
}
