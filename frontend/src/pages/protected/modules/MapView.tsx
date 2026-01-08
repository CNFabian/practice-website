import React from 'react';

interface MapViewProps {
  // Placeholder for future props
  onNeighborhoodSelect?: (neighborhoodId: string) => void;
}

const MapView: React.FC<MapViewProps> = ({ onNeighborhoodSelect }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-blue-100">
      <div className="max-w-2xl mx-auto text-center p-8">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Learning Map</h1>
          <p className="text-xl text-gray-600 mb-8">
            Explore different neighborhoods and unlock new learning adventures!
          </p>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Coming Soon Features:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Interactive neighborhood exploration</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Progress-based map unlocking</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Visual learning pathways</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Achievement landmarks</span>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            🗺️ Map view will replace the current module grid layout
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;