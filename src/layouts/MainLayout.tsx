import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header, Sidebar } from '../components/index'

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 overflow-hidden">
      <Header />
      <Sidebar />
      
      <main className="pt-14 pl-48 pr-2 h-screen overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout