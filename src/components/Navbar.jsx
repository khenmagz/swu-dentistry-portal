import { NavLink, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { useAuth } from "../hooks/useAuth";
import {
  FiFolder,
  FiFileText,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
} from "react-icons/fi";

export default function Navbar() {
  const { logout, currentUser, userRole, userData } = useAuth();
  const navigate = useNavigate();

  const [structuredCategories, setStructuredCategories] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileFormsOpen, setIsMobileFormsOpen] = useState(false);
  const [mobileExpandedCat, setMobileExpandedCat] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".profile-dropdown-container")) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const linkClass = ({ isActive }) =>
    isActive
      ? "text-(--color-accent) font-bold px-3 py-2 block lg:inline-block"
      : "text-white font-bold hover:text-gray-300 px-3 py-2 transition-colors block lg:inline-block";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setIsMobileFormsOpen(false);
    setMobileExpandedCat(null);
    setIsProfileOpen(false);
  };

  // Uses First Name if available, otherwise defaults to the first part of their email
  const firstNameDisplay = userData?.firstName
    ? userData.firstName
    : currentUser?.email
      ? currentUser.email.split("@")[0]
      : "Profile";

  const displayName = userData?.firstName
    ? `${userData.firstName} ${userData.lastName || ""}`.trim()
    : currentUser?.email;

  useEffect(() => {
    const q = query(collection(db, "forms"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedForms = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const grouped = fetchedForms.reduce((acc, form) => {
        const cat = form.category || "FORMS";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(form);
        return acc;
      }, {});

      const structured = Object.keys(grouped).map((catName) => {
        const files = grouped[catName];
        return {
          name: catName,
          isMultiple: files.length > 1,
          files: files,
          directId: files.length === 1 ? files[0].id : null,
        };
      });

      setStructuredCategories(
        structured.sort((a, b) => a.name.localeCompare(b.name)),
      );
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="bg-(--color-secondary) w-full relative">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between lg:justify-center h-14">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-white hover:text-gray-300 focus:outline-none p-2 cursor-pointer"
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
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>

          <div className="hidden lg:flex items-center space-x-2 xl:space-x-8 text-sm xl:text-base">
            <NavLink to="/" className={linkClass}>
              Home
            </NavLink>
            <NavLink to="/calendar" className={linkClass}>
              Calendar of Events
            </NavLink>
            <NavLink to="/room-assignment" className={linkClass}>
              Room Assignment
            </NavLink>
            <NavLink to="/organizational-chart" className={linkClass}>
              Organizational Chart
            </NavLink>
            <NavLink to="/tutorials" className={linkClass}>
              Tutorials
            </NavLink>

            <div className="relative group">
              <Link
                to="/forms"
                className={
                  linkClass({ isActive: false }) + " flex items-center gap-1"
                }
              >
                Documents
              </Link>

              <div className="absolute left-0 mt-1 w-60 bg-(--color-surface) border border-gray-200 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {structuredCategories.length === 0 ? (
                  <div className="px-4 py-3 text-xs text-(--color-secondary)">
                    No categories yet.
                  </div>
                ) : (
                  <ul className="py-1">
                    {structuredCategories.map((cat) => (
                      <li
                        key={cat.name}
                        className="relative group/sub border-b border-gray-100 last:border-0"
                      >
                        {cat.isMultiple ? (
                          <div className="w-full flex items-center justify-between px-4 py-3 text-sm text-(--color-secondary) hover:bg-(--color-primary) hover:text-white cursor-default font-medium transition">
                            <span className="truncate pr-2 flex items-center gap-2">
                              <FiFolder className="shrink-0" /> {cat.name}
                            </span>
                            <span className="text-gray-400 group-hover/sub:text-white">
                              <FiChevronLeft className="w-4 h-4" />
                            </span>
                          </div>
                        ) : (
                          <Link
                            to={`/forms/${cat.directId}`}
                            className="flex items-center gap-2 px-4 py-3 text-sm text-(--color-secondary) hover:bg-(--color-primary) hover:text-white font-medium transition"
                          >
                            <FiFileText className="shrink-0" />
                            <span className="truncate">{cat.name}</span>
                          </Link>
                        )}

                        {cat.isMultiple && (
                          <div className="absolute right-full top-0 -mr-px w-64 bg-white border border-gray-200 rounded shadow-xl opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-150 z-50 max-h-72 overflow-y-auto">
                            <ul className="py-1">
                              {cat.files.map((file) => (
                                <li
                                  key={file.id}
                                  className="border-b border-gray-50 last:border-0"
                                >
                                  <Link
                                    to={`/forms/${file.id}`}
                                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-100 hover:text-(--color-primary) transition"
                                    title={file.title}
                                  >
                                    <FiFileText className="shrink-0" />
                                    <span className="truncate">
                                      {file.title}
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Desktop Profile Box Container */}
            <div className="relative ml-4 profile-dropdown-container">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="cursor-pointer px-4 py-1.5 flex items-center justify-center rounded bg-(--color-primary) text-white font-bold hover:opacity-90 transition-opacity focus:outline-none"
              >
                <span className="truncate max-w-25 inline-block align-bottom">
                  {firstNameDisplay}
                </span>
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p
                      className="text-sm text-gray-900 truncate font-semibold"
                      title={displayName}
                    >
                      {displayName}
                    </p>

                    {userData?.firstName && (
                      <p
                        className="text-xs text-gray-500 truncate mt-0.5"
                        title={currentUser?.email}
                      >
                        {currentUser?.email}
                      </p>
                    )}
                  </div>
                  {userRole === "admin" && (
                    <NavLink
                      onClick={closeMobileMenu}
                      to="/add-user"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                    >
                      Manage Users
                    </NavLink>
                  )}
                  <div className="py-1">
                    <Link
                      to="/change-password"
                      onClick={closeMobileMenu}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="cursor-pointer w-full text-left block px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Profile Box Container */}
          <div className="lg:hidden relative profile-dropdown-container pr-2">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="cursor-pointer px-3 py-1 flex items-center justify-center rounded bg-(--color-primary) text-white font-bold text-sm hover:opacity-90 transition-opacity focus:outline-none"
            >
              <span className="truncate max-w-25 inline-block align-bottom">
                {firstNameDisplay}
              </span>
            </button>

            {isProfileOpen && (
              <div className="absolute right-2 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p
                    className="text-sm text-gray-900 truncate font-semibold"
                    title={displayName}
                  >
                    {displayName}
                  </p>
                  {userData?.firstName && (
                    <p
                      className="text-xs text-gray-500 truncate mt-0.5"
                      title={currentUser?.email}
                    >
                      {currentUser?.email}
                    </p>
                  )}
                </div>
                <div className="py-1">
                  {userRole === "admin" && (
                    <NavLink
                      onClick={closeMobileMenu}
                      to="/add-user"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                    >
                      Manage Users
                    </NavLink>
                  )}
                  <Link
                    to="/change-password"
                    onClick={closeMobileMenu}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors font-medium"
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="cursor-pointer w-full text-left block px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden pb-4 pt-2 border-t border-gray-700 absolute top-14 left-0 w-full bg-(--color-secondary) z-40 shadow-xl">
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
                to="/tutorials"
                onClick={closeMobileMenu}
                className={linkClass}
              >
                Tutorials
              </NavLink>

              <div className="w-full">
                <button
                  onClick={() => setIsMobileFormsOpen(!isMobileFormsOpen)}
                  className="w-full text-left text-white font-bold px-3 py-2 flex justify-between items-center cursor-pointer"
                >
                  <span>Documents</span>
                  <span>
                    {isMobileFormsOpen ? (
                      <FiChevronUp className="w-5 h-5" />
                    ) : (
                      <FiChevronDown className="w-5 h-5" />
                    )}
                  </span>
                </button>

                {isMobileFormsOpen && (
                  <div className="bg-gray-800 rounded-lg mx-1 mt-1 py-1 mb-2">
                    {structuredCategories.length === 0 ? (
                      <div className="px-4 py-2 text-xs text-gray-400">
                        No categories yet.
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-700 max-h-80 overflow-y-auto">
                        {structuredCategories.map((cat) => (
                          <li key={cat.name} className="py-1">
                            {cat.isMultiple ? (
                              <>
                                <button
                                  onClick={() =>
                                    setMobileExpandedCat(
                                      mobileExpandedCat === cat.name
                                        ? null
                                        : cat.name,
                                    )
                                  }
                                  className="cursor-pointer w-full flex justify-between items-center px-4 py-2.5 text-sm font-semibold text-gray-300"
                                >
                                  <span className="truncate pr-2 flex items-center gap-2">
                                    <FiFolder className="shrink-0" /> {cat.name}
                                  </span>
                                  <span className="text-gray-500 shrink-0">
                                    {mobileExpandedCat === cat.name ? (
                                      <FiChevronDown className="w-4 h-4" />
                                    ) : (
                                      <FiChevronRight className="w-4 h-4" />
                                    )}
                                  </span>
                                </button>
                                {mobileExpandedCat === cat.name && (
                                  <ul className="bg-gray-900 mx-2 my-1 rounded border-l-2 border-(--color-accent)">
                                    {cat.files.map((file) => (
                                      <li key={file.id}>
                                        <Link
                                          to={`/forms/${file.id}`}
                                          onClick={closeMobileMenu}
                                          className="flex items-center gap-2 px-4 py-2 text-xs text-gray-400 active:text-white"
                                        >
                                          <FiFileText className="shrink-0" />
                                          <span className="truncate">
                                            {file.title}
                                          </span>
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </>
                            ) : (
                              <Link
                                to={`/forms/${cat.directId}`}
                                onClick={closeMobileMenu}
                                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-300 active:text-white"
                              >
                                <FiFileText className="shrink-0" />
                                <span className="truncate">{cat.name}</span>
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              {userRole === "admin" && (
                <NavLink
                  to="/add-user"
                  onClick={closeMobileMenu}
                  className={linkClass}
                >
                  Manage Users
                </NavLink>
              )}
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
