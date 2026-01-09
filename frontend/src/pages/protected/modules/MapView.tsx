import React from 'react';

interface MapViewProps {
  onNeighborhoodSelect?: (neighborhoodId: string) => void;
  isTransitioning?: boolean;
}

const MapView: React.FC<MapViewProps> = ({ 
  onNeighborhoodSelect,
  isTransitioning = false 
}) => {
  const handleNeighborhoodClick = (neighborhoodId: string) => {
    if (!isTransitioning && onNeighborhoodSelect) {
      onNeighborhoodSelect(neighborhoodId);
    }
  };

  return (
    <div className="w-full h-full bg-gradient-to-b from-sky-400 via-sky-300 to-green-200 relative overflow-hidden">
      {/* Placeholder Map Interface */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🗺️ Map View
          </h2>
          <p className="text-gray-600 mb-6">
            Interactive map with learning neighborhoods coming soon!
          </p>
          
          <div className="space-y-3">
            <div className="text-left">
              <h4 className="font-semibold text-gray-800">Features:</h4>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Navigate learning neighborhoods</li>
                <li>• Track progress across regions</li>
                <li>• Unlock new areas</li>
                <li>• Visual progress indicators</li>
              </ul>
            </div>
          </div>

          {/* Demo Neighborhood Buttons */}
          {onNeighborhoodSelect && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-3">Preview Neighborhoods:</h4>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => handleNeighborhoodClick('downtown')}
                  disabled={isTransitioning}
                  className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 text-sm"
                >
                  Downtown
                </button>
                <button
                  onClick={() => handleNeighborhoodClick('suburbs')}
                  disabled={isTransitioning}
                  className="px-3 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 text-sm"
                >
                  Suburbs
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Decorative Map Elements */}
      <div className="absolute top-10 left-10 w-8 h-8 bg-yellow-400 rounded-full opacity-80 animate-pulse"></div>
      <div className="absolute top-20 right-20 w-6 h-6 bg-green-500 rounded-full opacity-60 animate-bounce"></div>
      <div className="absolute bottom-20 left-20 w-4 h-4 bg-blue-600 rounded-full opacity-70"></div>
      <div className="absolute bottom-10 right-10 w-10 h-10 bg-purple-500 rounded-full opacity-50 animate-pulse"></div>
    </div>
  );
};

export default MapView;