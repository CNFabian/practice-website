import React from 'react'

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🎯 Nest Navigate
        </h1>
        <p className="text-gray-600 mb-6">
          Video-based learning platform with gamification
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <div>✅ React 18 + TypeScript</div>
          <div>✅ Vite 6.0+ Build Tool</div>
          <div>✅ React Router v6</div>
          <div>✅ Redux Toolkit</div>
          <div>✅ TanStack Query</div>
          <div>✅ Tailwind CSS</div>
          <div>✅ Yarn Package Manager</div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
