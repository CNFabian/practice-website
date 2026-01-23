import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/index'
import { SidebarProvider, useSidebar } from '../contexts/SidebarContext'

const MainLayoutContent: React.FC = () => {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen overflow-hidden">
      <Sidebar />
      
      {/* Background layer - full viewport, behind content */}
      <div className="fixed inset-0 -z-10" id="section-background"></div>
      
      {/* Content layer - with dynamic padding based on sidebar state */}
      <main 
        className={`h-screen overflow-hidden relative z-0 transition-[padding] duration-300 ease-in-out ${
          isCollapsed ? 'pl-20' : 'pl-48'
        }`}
      >
        <Outlet />
      </main>
    </div>
  )
}

const MainLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <MainLayoutContent />
    </SidebarProvider>
  )
}

export default MainLayout