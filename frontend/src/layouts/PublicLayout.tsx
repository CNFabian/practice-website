import React from 'react'
import { Outlet } from 'react-router-dom'
import PublicHeader from '../components/public/PublicHeader'
import PublicFooter from '../components/public/PublicFooter'

const PublicLayout: React.FC = () => {
 return (
    <div className="min-h-screen bg-white flex flex-col">
      <PublicHeader />
      <main className="flex-1 bg-white">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  )
}

export default PublicLayout