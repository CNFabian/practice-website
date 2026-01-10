import React from 'react'
import { Outlet } from 'react-router-dom'
import {Sidebar } from '../components/index'

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen overflow-hidden">
      <Sidebar />
      
      {/* Background layer - full viewport, behind content */}
      <div className="fixed inset-0 -z-10" id="section-background"></div>
      
      {/* Content layer - with padding */}
      <main className="pl-48 h-screen overflow-hidden relative z-0">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout