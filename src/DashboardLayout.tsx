"use client"

import type React from "react"
import { useState } from "react"
import Dashboard from "./components/Dashboard/Dashboard"
import AdminDashboard from "./components/AdminPages/AdminDashboard"
import Sidebar from "./components/Dashboard/Sidebar"

const DashboardLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<"main" | "admin">("main")

  // Function to switch between main dashboard and admin portal
  const handleViewChange = (view: "main" | "admin") => {
    setCurrentView(view)
  }

  return (
    <div className="flex h-screen">
      <Sidebar onViewChange={handleViewChange} currentView={currentView} />
      <div className="flex-1 overflow-auto">{currentView === "main" ? <Dashboard /> : <AdminDashboard />}</div>
    </div>
  )
}

export default DashboardLayout

