import React from 'react'
import { Outlet } from 'react-router-dom'
import PublicHeader from '../components/public/PublicHeader'
import PublicFooter from '../components/public/PublicFooter'

const PublicLayout: React.FC = () => {
 return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}

export default PublicLayout