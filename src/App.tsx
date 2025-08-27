import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Sidebar from './components/Sidebar'

// Page components
const OverviewPage = () => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <Sidebar />
    <main className="pt-16 pl-48">
      <div className="p-6">
        <h1 className="text-3xl font-bold">Welcome to Overview page</h1>
      </div>
    </main>
  </div>
)

const ModulesPage = () => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <Sidebar />
    <main className="pt-16 pl-48">
      <div className="p-6">
        <h1 className="text-3xl font-bold">Welcome to Modules page</h1>
      </div>
    </main>
  </div>
)

const SavedPage = () => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <Sidebar />
    <main className="pt-16 pl-48">
      <div className="p-6">
        <h1 className="text-3xl font-bold">Welcome to Saved page</h1>
      </div>
    </main>
  </div>
)

const RewardsPage = () => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <Sidebar />
    <main className="pt-16 pl-48">
      <div className="p-6">
        <h1 className="text-3xl font-bold">Welcome to Rewards page</h1>
      </div>
    </main>
  </div>
)

const BadgesPage = () => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <Sidebar />
    <main className="pt-16 pl-48">
      <div className="p-6">
        <h1 className="text-3xl font-bold">Welcome to Badges page</h1>
      </div>
    </main>
  </div>
)

const HelpPage = () => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <Sidebar />
    <main className="pt-16 pl-48">
      <div className="p-6">
        <h1 className="text-3xl font-bold">Welcome to Help page</h1>
      </div>
    </main>
  </div>
)

const SettingsPage = () => (
  <div className="min-h-screen bg-gray-50">
    <Header />
    <Sidebar />
    <main className="pt-16 pl-48">
      <div className="p-6">
        <h1 className="text-3xl font-bold">Welcome to Settings page</h1>
      </div>
    </main>
  </div>
)

function App() {
  return (
    <Routes>
      <Route path="/" element={<OverviewPage />} />
      <Route path="/modules" element={<ModulesPage />} />
      <Route path="/saved" element={<SavedPage />} />
      <Route path="/rewards" element={<RewardsPage />} />
      <Route path="/badges" element={<BadgesPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  )
}

export default App