import { Routes, Route } from 'react-router-dom'
import { Header, Sidebar } from './components'

import {
  OverviewPage,
  ModulesPage,
  SavedPage,
  RewardsPage,
  BadgesPage,
  HelpPage,
  SettingsPage
} from './pages'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      
      <main className="pt-16 pl-48">
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/modules" element={<ModulesPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/rewards" element={<RewardsPage />} />
          <Route path="/badges" element={<BadgesPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App