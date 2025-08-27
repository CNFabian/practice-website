import React from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <main className="pt-16 pl-48">
        <div className="p-6">
          <h1 className="text-3xl font-bold">Welcome to Nest Navigate</h1>
        </div>
      </main>
    </div>
  );
};

export default HomePage;