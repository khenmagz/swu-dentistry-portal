import { createContext, useState, useEffect } from "react";
import { auth, db } from "../firebase"; // Make sure this points to your firebase config file
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null); // This will store "admin" or "teacher"
  const [loading, setLoading] = useState(true);

  // Function to log in
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Function to log out
  const logout = () => {
    return signOut(auth);
  };

  useEffect(() => {
    // This listens to see if someone logs in or logs out
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        // If a user is found, go into Firestore to find their role
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          setUserRole(userDocSnap.data().role); // Saves "admin" to the state
        } else {
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }
      setLoading(false); // We are done checking
    });

    return unsubscribe;
  }, []);

  // We bundle these values up to send to the rest of the app
  const value = {
    currentUser,
    userRole,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
