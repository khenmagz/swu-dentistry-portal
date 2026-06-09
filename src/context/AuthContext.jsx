import { createContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  // NEW: Store the user's extra Firestore data (like firstName)
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    let unsubscribeSnapshot = null; // We need a way to clean up the Firestore listener

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Instead of a one-time getDoc, we set up a REAL-TIME listener
        const userDocRef = doc(db, "users", user.uid);

        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            // They are valid! Set their data and stop loading.
            setCurrentUser(user);
            setUserRole(docSnap.data().role);
            // NEW: Save all their Firestore fields so we can use them anywhere!
            setUserData(docSnap.data());
            setLoading(false);
          } else {
            // SOFT BAN TRIGGERED!
            // Their document was deleted (or never existed).
            // We force a sign-out instantly before showing them any pages.
            signOut(auth).then(() => {
              setCurrentUser(null);
              setUserRole(null);
              setUserData(null); // Reset
              setLoading(false);
            });
          }
        });
      } else {
        // No user is logged in
        setCurrentUser(null);
        setUserRole(null);
        setUserData(null); // Reset
        setLoading(false);

        // Clean up the database listener if they log out
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
        }
      }
    });

    // Cleanup both listeners when the app closes
    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const value = {
    currentUser,
    userRole,
    userData, // NEW: Pass it down so Home and Navbar can see it!
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
