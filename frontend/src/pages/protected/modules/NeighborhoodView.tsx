import React from 'react';

interface NeighborhoodViewProps {
  neighborhoodId?: string;
  onHouseSelect?: (houseId: string) => void;
  onBackToMap?: () => void;
}

const NeighborhoodView: React.FC<NeighborhoodViewProps> = ({ 
  neighborhoodId, 
  onHouseSelect, 
  onBackToMap 
}) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-100">
      <div className="max-w-2xl mx-auto text-center p-8">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto mb-6 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {neighborhoodId ? `${neighborhoodId} Neighborhood` : 'Learning Neighborhood'}
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Choose a house to explore different module topics and lessons!
          </p>
          
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Coming Soon Features:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Multiple themed houses</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Module grouping by topic</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Progress visualization</span>
              </div>
              <div className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                <span className="text-gray-700">Unlock requirements</span>
              </div>
            </div>
          </div>
          
          {onBackToMap && (
            <button 
              onClick={onBackToMap}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors mb-4"
            >
              ← Back to Map
            </button>
          )}
          
          <div className="text-sm text-gray-500">
            🏘️ Neighborhood view will group related modules into houses
          </div>
        </div>
      </div>
    </div>
  );
};

export default NeighborhoodView;