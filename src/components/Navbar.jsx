import { NavLink, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
export default function Navbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownForms, setDropdownForms] = useState([]);
  const linkClass = ({ isActive }) =>
    isActive
      ? "text-(--color-accent) font-bold px-3 py-2"
      : "text-white  font-bold hover:text-gray-300 px-3  py-2 transition-colors";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
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
    <div className="bg-(--color-secondary) w-full">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center  justify-center h-14 space-x-4 md:space-x-8 text-sm md:text-base">
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
          <div className="relative group">
            {/* Main Link (Always visible) */}
            <Link
              to="/forms"
              className={
                linkClass({ isActive: false }) + " flex items-center gap-1"
              }
            >
              Forms &#9662; {/* The little down arrow */}
            </Link>

            {/* Hidden Dropdown Box (Appears on hover) */}
            <div className="absolute left-0 mt-1 w-56 bg-(--color-surface) border border-gray-200 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
              {/* Link to the main directory */}
              <Link
                to="/forms"
                className="block px-4 py-3 text-sm font-bold text-(--color-primary) bg-gray-100 border-b border-gray-200 hover:bg-gray-200"
              >
                All Forms Directory
              </Link>

              {/* Dynamically list all uploaded forms */}
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
                        className="block px-4 py-3 text-sm text-(--color-secondary) hover:bg-(--color-primary) hover:text-(--color-background) transition"
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
            className="bg-(--color-accent) text-(--color-background) px-4 py-2 rounded hover:opacity-90"
          >
            Log Out
          </button>
        </div>
      </nav>
    </div>
  );
}
