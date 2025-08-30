import React from 'react'
import { Outlet } from 'react-router-dom'
import { Header, Sidebar } from '../index'

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      
      <main className="pt-16 pl-48">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout