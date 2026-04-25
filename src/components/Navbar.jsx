import { NavLink, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";

export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownForms, setDropdownForms] = useState([]);

  // New States for Mobile Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileFormsOpen, setIsMobileFormsOpen] = useState(false); // Controls the accordion for forms on mobile

  const linkClass = ({ isActive }) =>
    isActive
      ? "text-(--color-accent) font-bold px-3 py-2 block md:inline-block"
      : "text-white font-bold hover:text-gray-300 px-3 py-2 transition-colors block md:inline-block";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  // Close mobile menu when a link is clicked
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileFormsOpen(false);
  };

  useEffect(() => {
    const q = query(collection(db, "forms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedForms = snapshot.docs.map((doc) => ({
        id: doc.id,
        title: doc.data().title,
      }));
      setDropdownForms(fetchedForms);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-(--color-secondary) w-full relative">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between md:justify-center h-14">
          {/* Hamburger Menu Button (Visible ONLY on Mobile) */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-white hover:text-gray-300 focus:outline-none p-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                /> // X icon
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                /> // Hamburger icon
              )}
            </svg>
          </button>

          {/* DESKTOP MENU (Hidden on Mobile) */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-8 text-sm md:text-base">
            <NavLink to="/" className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/calendar" className={linkClass}>
              School Calendar
            </NavLink>
            <NavLink to="/room-assignment" className={linkClass}>
              Room Assignment
            </NavLink>
            <NavLink to="/organizational-chart" className={linkClass}>
              Organizational Chart
            </NavLink>
            <NavLink to="/students" className={linkClass}>
              List of Students
            </NavLink>
            <NavLink to="/tutorials" className={linkClass}>
              Tutorials
            </NavLink>

            {/* Desktop Forms Dropdown (Hover based) */}
            <div className="relative group">
              <Link
                to="/forms"
                className={
                  linkClass({ isActive: false }) + " flex items-center gap-1"
                }
              >
                Forms &#9662;
              </Link>
              <div className="absolute left-0 mt-1 w-56 bg-(--color-surface) border border-gray-200 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                <Link
                  to="/forms"
                  className="block px-4 py-3 text-sm font-bold text-(--color-primary) bg-gray-100 border-b border-gray-200 hover:bg-gray-200"
                >
                  All Forms Directory
                </Link>
                {dropdownForms.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-(--color-secondary)">
                    No forms uploaded yet.
                  </div>
                ) : (
                  <ul className="max-h-60 overflow-y-auto">
                    {dropdownForms.map((form) => (
                      <li
                        key={form.id}
                        className="border-b border-gray-100 last:border-0"
                      >
                        <Link
                          to={`/forms/${form.id}`}
                          className="block px-4 py-3 text-sm text-(--color-secondary) hover:bg-(--color-primary) hover:text-white transition"
                        >
                          {form.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="bg-(--color-accent) text-white px-4 py-1.5 rounded hover:opacity-90 transition"
            >
              Log Out
            </button>
          </div>

          {/* Mobile Log Out Button (Just so it's easily accessible) */}
          <div className="md:hidden">
            <button
              onClick={handleLogout}
              className="text-xs bg-(--color-accent) text-white px-3 py-1.5 rounded hover:opacity-90"
            >
              Log Out
            </button>
          </div>
        </div>

        {/* MOBILE MENU (Visible ONLY when Hamburger is clicked) */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 pt-2 border-t border-gray-700 absolute top-14 left-0 w-full bg-(--color-secondary) z-50 shadow-xl">
            <div className="flex flex-col space-y-1 px-4">
              <NavLink to="/" onClick={closeMobileMenu} className={linkClass}>
                Home
              </NavLink>
              <NavLink
                to="/calendar"
                onClick={closeMobileMenu}
                className={linkClass}
              >
                School Calendar
              </NavLink>
              <NavLink
                to="/room-assignment"
                onClick={closeMobileMenu}
                className={linkClass}
              >
                Room Assignment
              </NavLink>
              <NavLink
                to="/organizational-chart"
                onClick={closeMobileMenu}
                className={linkClass}
              >
                Organizational Chart
              </NavLink>
              <NavLink
                to="/students"
                onClick={closeMobileMenu}
                className={linkClass}
              >
                List of Students
              </NavLink>
              <NavLink
                to="/tutorials"
                onClick={closeMobileMenu}
                className={linkClass}
              >
                Tutorials
              </NavLink>

              {/* Mobile Forms Accordion */}
              <div className="w-full">
                <button
                  onClick={() => setIsMobileFormsOpen(!isMobileFormsOpen)}
                  className="w-full text-left text-white font-bold px-3 py-2 flex justify-between items-center"
                >
                  Forms{" "}
                  {isMobileFormsOpen ? (
                    <span>&#9652;</span>
                  ) : (
                    <span>&#9662;</span>
                  )}
                </button>

                {/* Expandable list for mobile forms */}
                {isMobileFormsOpen && (
                  <div className="bg-gray-800 rounded-lg mx-2 mt-1 py-2 mb-2">
                    <Link
                      to="/forms"
                      onClick={closeMobileMenu}
                      className="block px-4 py-2 text-sm text-(--color-accent) font-bold border-b border-gray-700"
                    >
                      All Forms Directory
                    </Link>
                    {dropdownForms.length === 0 ? (
                      <div className="px-4 py-2 text-xs text-gray-400">
                        No forms uploaded yet.
                      </div>
                    ) : (
                      <ul className="max-h-48 overflow-y-auto">
                        {dropdownForms.map((form) => (
                          <li
                            key={form.id}
                            className="border-b border-gray-700 last:border-0"
                          >
                            <Link
                              to={`/forms/${form.id}`}
                              onClick={closeMobileMenu}
                              className="block px-4 py-3 text-sm text-gray-300 active:bg-(--color-primary) active:text-white"
                            >
                              {form.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
