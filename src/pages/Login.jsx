import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import bgImage from "../assets/bg-villa.jpg";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError("Wrong email or password. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-(--color-background)">
      <div
        className="absolute inset-0 z-0 opacity-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      {/* Main Card Container - Added relative and z-10 to stay above the background */}
      <div className="bg-(--color-surface) p-10 rounded-xl shadow-xl w-full max-w-md border border-gray-200 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-(--color-primary) tracking-tight">
            Faculty Portal
          </h2>
          <p className="text-(--color-secondary) mt-2 opacity-70">
            Please sign in to your account
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-(--color-accent) text-white p-3 rounded-lg mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Input */}
          <div>
            <label className="block text-(--color-secondary) font-semibold mb-1.5 text-sm">
              Email Address
            </label>
            <input
              type="email"
              className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary) focus:border-transparent outline-none transition-all"
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-(--color-secondary) font-semibold mb-1.5 text-sm">
              Password
            </label>
            <input
              type="password"
              className="w-full p-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-(--color-primary) focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-(--color-primary) text-white font-bold p-3 rounded-lg transition-all transform active:scale-[0.98] ${
              isLoading
                ? "opacity-70 cursor-not-allowed"
                : "hover:shadow-lg hover:brightness-110"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                {/* Simple CSS Spinner */}
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
                Logging in...
              </span>
            ) : (
              "Log In"
            )}
          </button>
        </form>

        {/* Footer Link - Updated */}
        <div className="mt-8 text-center">
          <Link
            to="/forgot-password"
            className="text-sm font-semibold text-(--color-primary) hover:text-(--color-accent) hover:underline transition-colors p-2"
          >
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
