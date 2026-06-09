import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";

export default function ChangePassword() {
  const { currentUser, userData } = useAuth();

  // --- Profile State ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  // --- Password State ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [loadingPass, setLoadingPass] = useState(false);

  // Pre-fill the profile form when userData loads
  useEffect(() => {
    if (userData) {
      setFirstName(userData.firstName || "");
      setLastName(userData.lastName || "");
    }
  }, [userData]);

  // Handle Name Update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMsg({ type: "", text: "" });
    setSavingProfile(true);

    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setProfileMsg({ type: "success", text: "Profile updated successfully!" });
    } catch (err) {
      console.error(err);
      setProfileMsg({ type: "error", text: "Failed to update profile." });
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Update
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPassError("");
    setPassSuccess("");

    if (newPassword.length < 6) {
      return setPassError("New password must be at least 6 characters.");
    }
    if (newPassword !== confirmPassword) {
      return setPassError("New passwords do not match.");
    }

    try {
      setLoadingPass(true);
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword,
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setPassSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setPassError(
        "Failed to update password. Please verify your current password is correct.",
      );
    } finally {
      setLoadingPass(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12 space-y-8 pb-12">
      {/* --- PROFILE SECTION --- */}
      <div className="bg-(--color-surface) p-8 rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-(--color-primary) mb-6 text-center">
          Profile Settings
        </h2>

        {profileMsg.text && (
          <div
            className={`border-l-4 p-3 mb-4 text-sm font-medium ${
              profileMsg.type === "success"
                ? "bg-green-100 border-green-500 text-green-700"
                : "bg-red-100 border-red-500 text-red-700"
            }`}
          >
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-(--color-primary) mb-1">
                First Name
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary)"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-(--color-primary) mb-1">
                Last Name
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-(--color-primary) focus:ring-1 focus:ring-(--color-primary)"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="w-full mt-2 bg-(--color-primary) text-white font-bold py-2.5 px-4 rounded hover:opacity-90 transition disabled:opacity-70 flex justify-center"
          >
            {savingProfile ? "Saving..." : "Update Profile"}
          </button>
        </form>
      </div>

      {/* --- PASSWORD SECTION --- */}
      <div className="bg-(--color-surface) p-8 rounded-lg shadow-lg border border-gray-200">
        <h2 className="text-2xl font-bold text-(--color-primary) mb-6 text-center">
          Security & Password
        </h2>

        {passError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 text-sm font-medium">
            {passError}
          </div>
        )}
        {passSuccess && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 mb-4 text-sm font-medium">
            {passSuccess}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
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
            disabled={loadingPass}
            className="w-full mt-4 bg-(--color-primary) text-white font-bold py-2.5 px-4 rounded hover:opacity-90 transition disabled:opacity-70 flex justify-center"
          >
            {loadingPass ? "Updating..." : "Save New Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
