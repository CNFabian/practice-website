import React from 'react'
import Header from '../components/header'
  
const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-grow flex items-center justify-center">
        <h1 className="text-3xl font-bold">Welcome to Nest Navigate</h1>
      </div>
    </div>
  )
}

export default HomePage