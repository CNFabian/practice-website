import React, { useEffect } from 'react';

interface HousePosition {
  id: string;
  name: string;
  x: number; // Percentage from left (0-100)
  y: number; // Percentage from top (0-100)
  isLocked?: boolean;
}

interface NeighborhoodViewProps {
  neighborhoodId?: string;
  onHouseSelect?: (houseId: string) => void;
  onBackToMap?: () => void;
  isTransitioning?: boolean;
  houses?: HousePosition[]; // Optional array of houses with positions
}

const NeighborhoodView: React.FC<NeighborhoodViewProps> = ({ 
  neighborhoodId,
  onHouseSelect,
  onBackToMap,
  isTransitioning = false,
  houses = [] // Default to empty array if not provided
}) => {
  // Set the background for this section
  useEffect(() => {
    const bgElement = document.getElementById('section-background');
    if (bgElement) {
      // Force immediate style update
      bgElement.style.setProperty('background', 'rgb(254, 215, 170)', 'important');
      bgElement.style.backgroundSize = 'cover';
    }
  }, [neighborhoodId, isTransitioning]); 

  const handleHouseClick = (houseId: string, isLocked: boolean = false) => {
    if (!isTransitioning && onHouseSelect && !isLocked) {
      onHouseSelect(houseId);
    }
  };

  return (
    <div className="w-full h-full relative overflow-hidden">
      {/* Back Button */}
      {onBackToMap && (
        <div className="absolute top-4 left-4 z-10">
          <button
            onClick={onBackToMap}
            disabled={isTransitioning}
            className="flex items-center gap-2 px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg hover:bg-white transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Map
          </button>
        </div>
      )}

      {/* Houses positioned on the map */}
      {houses.map((house) => (
        <div
          key={house.id}
          className="absolute"
          style={{
            left: `${house.x}%`,
            top: `${house.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <button
            onClick={() => handleHouseClick(house.id, house.isLocked)}
            disabled={isTransitioning || house.isLocked}
            className={`
              group relative transition-all duration-300
              ${house.isLocked ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'}
              ${isTransitioning ? 'opacity-50' : ''}
            `}
          >
            {/* House Icon */}
            <div className={`
              w-20 h-20 rounded-lg shadow-lg flex items-center justify-center
              transition-all duration-300
              ${house.isLocked 
                ? 'bg-gray-300' 
                : 'bg-orange-500 hover:bg-orange-600 group-hover:shadow-xl'
              }
            `}>
              {house.isLocked ? (
                <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              )}
            </div>

            {/* House Name Label */}
            <div className={`
              absolute -bottom-8 left-1/2 transform -translate-x-1/2
              px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap
              transition-all duration-300
              ${house.isLocked 
                ? 'bg-gray-200 text-gray-600' 
                : 'bg-white/90 text-gray-800 group-hover:bg-white'
              }
            `}>
              {house.name}
            </div>
          </button>
        </div>
      ))}

      {/* Placeholder content when no houses are provided */}
      {houses.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-8 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl max-w-lg">
            <div className="w-16 h-16 mx-auto mb-4 bg-orange-500 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              🏘️ Neighborhood View
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              {neighborhoodId ? `Exploring: ${neighborhoodId}` : 'Learning Neighborhood'}
            </p>
            
            <div className="space-y-4">
              <div className="text-left">
                <h4 className="font-semibold text-gray-800">Coming Features:</h4>
                <ul className="text-sm text-gray-600 mt-2 space-y-1">
                  <li>• Themed learning houses</li>
                  <li>• Progressive unlocking</li>
                  <li>• Neighborhood achievements</li>
                  <li>• Interactive house selection</li>
                </ul>
              </div>
            </div>

            {/* Demo House Buttons */}
            {onHouseSelect && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-800 mb-3">Preview Houses:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleHouseClick('starter_house')}
                    disabled={isTransitioning}
                    className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 text-sm"
                  >
                    Starter House
                  </button>
                  <button
                    onClick={() => handleHouseClick('advanced_house')}
                    disabled={isTransitioning}
                    className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 transition-colors disabled:opacity-50 text-sm"
                  >
                    Advanced House
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NeighborhoodView;