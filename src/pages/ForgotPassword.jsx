import { useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import {
  FiArrowLeft,
  FiMail,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import bgImage from "../assets/bg-villa.jpg";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage(
        "Check your inbox! We have sent a password reset link to your email.",
      );
    } catch (err) {
      console.error(err);
      setError("Failed to reset password. Make sure the email is correct.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-(--color-background)">
      <div
        className="absolute inset-0 z-0 opacity-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      />

      {/* Main Card Container - Slightly wider and larger padding for accessibility */}
      <div className="bg-(--color-surface) p-10 md:p-12 rounded-xl shadow-xl w-full max-w-lg border border-gray-200 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-extrabold text-(--color-primary) tracking-tight">
            Reset Password
          </h2>
          <p className="text-(--color-secondary) mt-3 text-base opacity-80">
            Enter your email to receive a reset link
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-800 p-4 rounded-lg mb-6 text-base font-medium flex items-center gap-3">
            <FiAlertCircle className="w-6 h-6 shrink-0" />
            {error}
          </div>
        )}
        {message && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 rounded-lg mb-6 text-base font-medium flex items-center gap-3">
            <FiCheckCircle className="w-6 h-6 shrink-0" />
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div>
            <label className="block text-(--color-secondary) font-bold mb-2 text-base">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiMail className="h-6 w-6 text-gray-400" />
              </div>
              <input
                type="email"
                className="w-full pl-11 p-4 text-base bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary) focus:border-transparent outline-none transition-all"
                placeholder="name@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-(--color-primary) text-white font-bold p-4 text-base rounded-lg transition-all transform active:scale-[0.98] flex justify-center items-center ${
              isLoading
                ? "opacity-70 cursor-not-allowed"
                : "hover:shadow-lg hover:brightness-110"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-3">
                <svg
                  className="animate-spin h-6 w-6 text-white"
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
                Sending Link...
              </span>
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 text-base text-(--color-primary) font-bold hover:underline p-2 rounded transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
