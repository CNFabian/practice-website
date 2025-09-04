import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header, Sidebar } from '../components/index'

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      
      <main className="pt-16 pl-48 relative z-0 overflow-hidden">
        <div className="max-h-[calc(100vh-64px)] overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default MainLayout