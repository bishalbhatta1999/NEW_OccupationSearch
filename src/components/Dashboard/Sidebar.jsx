"use client";

import { useState, useEffect } from "react";
import {
  FaUserCircle,
  FaFileUpload,
  FaChevronLeft,
  FaChevronRight,
  FaShieldAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const navigate = useNavigate();

  // Check if the current user is a super admin
  useEffect(() => {
    const checkSuperAdminStatus = async () => {
      if (auth.currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Check if user is a super admin
            setIsSuperAdmin(
              userData.role === "superAdmin" ||
                userData.email === "info@occupationsearch.com.au"
            );
          }
        } catch (error) {
          console.error("Error checking super admin status:", error);
          setIsSuperAdmin(false);
        }
      }
    };

    checkSuperAdminStatus();

    // Set up auth state listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkSuperAdminStatus();
      } else {
        setIsSuperAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAdminPortalClick = () => {
    navigate("/admin/dashboard");
  };

  return (
    <div
      className={`${
        collapsed ? "w-16" : "w-64"
      } bg-indigo-700 text-white transition-all duration-300 flex flex-col`}
    >
      <div className="flex items-center justify-between p-4 border-b border-indigo-600">
        <h2 className={`font-bold text-xl ${collapsed ? "hidden" : "block"}`}>
          Dashboard
        </h2>
        <button onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        <a
          href="#profile"
          className="flex items-center p-2 rounded hover:bg-indigo-600"
        >
          <FaUserCircle className="mr-2" />
          {!collapsed && "Profile"}
        </a>
        <a
          href="#upload"
          className="flex items-center p-2 rounded hover:bg-indigo-600"
        >
          <FaFileUpload className="mr-2" />
          {!collapsed && "Upload"}
        </a>

        {/* Admin Portal Link - Only shown to super admin users */}
        {isSuperAdmin && (
          <button
            onClick={handleAdminPortalClick}
            className="flex items-center p-2 rounded hover:bg-indigo-600 w-full text-left text-yellow-300 font-medium"
          >
            <FaShieldAlt className="mr-2" />
            {!collapsed && "Admin Portal"}
          </button>
        )}
      </nav>
    </div>
  );
};

export default Sidebar;
