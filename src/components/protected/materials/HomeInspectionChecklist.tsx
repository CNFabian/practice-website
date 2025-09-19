import React, { useState } from 'react';
import InfoButton from './InfoButton';
import InfoModal from './InfoModal';
import { calculatorInfoData } from './InfoData';

interface InspectionItem {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  completed: boolean;
  notes?: string;
}

const HomeInspectionChecklist: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([
    // Exterior
    {
      id: 'roof-condition',
      title: 'Roof Condition',
      description: 'Check for missing shingles, damage, or signs of leaking.',
      category: 'Exterior',
      priority: 'High',
      completed: false
    },
    {
      id: 'gutters-downspouts',
      title: 'Gutters and Downspouts',
      description: 'Ensure proper drainage and no clogs or damage.',
      category: 'Exterior',
      priority: 'Medium',
      completed: false
    },
    {
      id: 'siding-exterior',
      title: 'Siding and Exterior Walls',
      description: 'Look for cracks, damage, or signs of moisture.',
      category: 'Exterior',
      priority: 'High',
      completed: false
    },
    {
      id: 'windows-doors',
      title: 'Windows and Doors',
      description: 'Check for proper operation, sealing, and security.',
      category: 'Exterior',
      priority: 'Medium',
      completed: false
    },
    {
      id: 'foundation',
      title: 'Foundation',
      description: 'Inspect for cracks, settling, or water damage.',
      category: 'Exterior',
      priority: 'High',
      completed: false
    },
    {
      id: 'driveway-walkways',
      title: 'Driveway and Walkways',
      description: 'Check for cracks, uneven surfaces, or drainage issues.',
      category: 'Exterior',
      priority: 'Low',
      completed: false
    },

    // Interior
    {
      id: 'flooring',
      title: 'Flooring Condition',
      description: 'Check for damage, squeaks, or uneven areas.',
      category: 'Interior',
      priority: 'Medium',
      completed: false
    },
    {
      id: 'walls-ceilings',
      title: 'Walls and Ceilings',
      description: 'Look for cracks, stains, or signs of water damage.',
      category: 'Interior',
      priority: 'Medium',
      completed: false
    },
    {
      id: 'interior-doors',
      title: 'Interior Doors',
      description: 'Test operation, locks, and hardware.',
      category: 'Interior',
      priority: 'Low',
      completed: false
    },
    {
      id: 'stairs-railings',
      title: 'Stairs and Railings',
      description: 'Check stability, safety, and building code compliance.',
      category: 'Interior',
      priority: 'High',
      completed: false
    },
    {
      id: 'storage-areas',
      title: 'Storage Areas',
      description: 'Inspect closets, basement, and attic for issues.',
      category: 'Interior',
      priority: 'Low',
      completed: false
    },

    // Electrical System
    {
      id: 'electrical-panel',
      title: 'Electrical Panel',
      description: 'Check panel condition, labeling, and circuit breakers.',
      category: 'Electrical System',
      priority: 'High',
      completed: false
    },
    {
      id: 'outlets-switches',
      title: 'Outlets and Switches',
      description: 'Test all outlets and switches for proper operation.',
      category: 'Electrical System',
      priority: 'Medium',
      completed: false
    },
    {
      id: 'gfci-protection',
      title: 'GFCI Protection',
      description: 'Verify GFCI outlets in bathrooms, kitchen, and outdoor areas.',
      category: 'Electrical System',
      priority: 'High',
      completed: false
    },
    {
      id: 'electrical-wiring',
      title: 'Visible Wiring',
      description: 'Check for damaged, exposed, or outdated wiring.',
      category: 'Electrical System',
      priority: 'High',
      completed: false
    },

    // Plumbing System
    {
      id: 'water-pressure',
      title: 'Water Pressure',
      description: 'Test water pressure in all faucets and showers.',
      category: 'Plumbing System',
      priority: 'Medium',
      completed: false
    },
    {
      id: 'leaks-drips',
      title: 'Leaks and Drips',
      description: 'Check for any visible leaks under sinks and around fixtures.',
      category: 'Plumbing System',
      priority: 'High',
      completed: false
    },
    {
      id: 'toilet-function',
      title: 'Toilet Function',
      description: 'Test all toilets for proper flushing and stability.',
      category: 'Plumbing System',
      priority: 'Medium',
      completed: false
    },
    {
      id: 'water-heater',
      title: 'Water Heater',
      description: 'Check age, condition, and proper venting of water heater.',
      category: 'Plumbing System',
      priority: 'High',
      completed: false
    },
    {
      id: 'drainage',
      title: 'Drainage',
      description: 'Test all drains for proper flow and no backups.',
      category: 'Plumbing System',
      priority: 'Medium',
      completed: false
    },

    // HVAC System
    {
      id: 'heating-system',
      title: 'Heating System',
      description: 'Test heating system operation and check for proper heating.',
      category: 'HVAC System',
      priority: 'High',
      completed: false
    },
    {
      id: 'cooling-system',
      title: 'Air Conditioning',
      description: 'Test AC operation and check for proper cooling.',
      category: 'HVAC System',
      priority: 'High',
      completed: false
    },
    {
      id: 'ductwork',
      title: 'Ductwork',
      description: 'Inspect visible ducts for damage or poor connections.',
      category: 'HVAC System',
      priority: 'Medium',
      completed: false
    },
    {
      id: 'air-filters',
      title: 'Air Filters',
      description: 'Check filter condition and accessibility.',
      category: 'HVAC System',
      priority: 'Low',
      completed: false
    },
    {
      id: 'ventilation',
      title: 'Ventilation',
      description: 'Check bathroom and kitchen exhaust fans.',
      category: 'HVAC System',
      priority: 'Medium',
      completed: false
    },

    // Safety Features
    {
      id: 'smoke-detectors',
      title: 'Smoke Detectors',
      description: 'Test all smoke detectors and check battery levels.',
      category: 'Safety Features',
      priority: 'High',
      completed: false
    },
    {
      id: 'carbon-monoxide',
      title: 'Carbon Monoxide Detectors',
      description: 'Verify CO detectors are present and functional.',
      category: 'Safety Features',
      priority: 'High',
      completed: false
    },
    {
      id: 'fire-extinguisher',
      title: 'Fire Safety',
      description: 'Check for fire extinguisher and escape routes.',
      category: 'Safety Features',
      priority: 'Medium',
      completed: false
    },
    {
      id: 'security-features',
      title: 'Security Features',
      description: 'Test locks, alarms, and security systems.',
      category: 'Safety Features',
      priority: 'Medium',
      completed: false
    }
  ]);

  const [notes, setNotes] = useState<{ [key: string]: string }>({});

  const handleDownloadPDF = () => {
    setShowModal(true);
  };

  const handleShareProgress = () => {
    setShowModal(true);
  };

  const toggleItem = (id: string) => {
    setInspectionItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const updateNotes = (id: string, noteText: string) => {
    setNotes(prev => ({ ...prev, [id]: noteText }));
  };

  const categories = [...new Set(inspectionItems.map(item => item.category))];
  const groupedItems = categories.map(category => ({
    name: category,
    items: inspectionItems.filter(item => item.category === category)
  }));

  const totalItems = inspectionItems.length;
  const completedItems = inspectionItems.filter(item => item.completed).length;
  const highPriorityItems = inspectionItems.filter(item => item.priority === 'High').length;
  const completedHighPriority = inspectionItems.filter(item => item.priority === 'High' && item.completed).length;
  const progressPercentage = (completedItems / totalItems) * 100;

  const priorityColors = {
    High: 'bg-red-100 text-red-700 border-red-200',
    Medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    Low: 'bg-green-100 text-green-700 border-green-200'
  };

  const Modal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🚧</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Feature Under Development</h3>
          <p className="text-gray-600 mb-6">This feature is currently being developed and will be available soon.</p>
          <button 
            onClick={() => setShowModal(false)}
            className="w-full bg-blue-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-600 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 relative">
        {/* Info Button - positioned in top right */}
        <div className="absolute top-0 right-0">
          <InfoButton onClick={() => setIsInfoModalOpen(true)} />
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-3 pr-12">
          Home Inspection Checklist
        </h1>
        <p className="text-gray-600 leading-relaxed">
          Use this comprehensive checklist during your home inspection to ensure you don't miss any critical areas. 
          Take notes and mark items as you inspect them.
        </p>
        
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Inspection Progress</span>
            <span className="text-sm font-medium text-gray-700">
              {completedItems}/{totalItems} items checked
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Inspection Items by Category */}
      <div className="space-y-8">
        {groupedItems.map((group) => {
          const categoryCompleted = group.items.filter(item => item.completed).length;
          
          return (
            <div key={group.name} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {group.name}
                </h2>
                <span className="text-sm text-gray-500">
                  {categoryCompleted}/{group.items.length} completed
                </span>
              </div>
              
              <div className="space-y-4">
                {group.items.map((item) => (
                  <div 
                    key={item.id}
                    className="border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <div 
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                            item.completed 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onClick={() => toggleItem(item.id)}
                        >
                          {item.completed && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className={`font-medium ${
                            item.completed ? 'text-green-800 line-through' : 'text-gray-900'
                          }`}>
                            {item.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${priorityColors[item.priority]}`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className={`text-sm mb-3 ${
                          item.completed ? 'text-green-700' : 'text-gray-600'
                        }`}>
                          {item.description}
                        </p>
                        
                        {/* Notes Section */}
                        <div className="mt-3">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Notes:
                          </label>
                          <textarea
                            value={notes[item.id] || ''}
                            onChange={(e) => updateNotes(item.id, e.target.value)}
                            placeholder="Add inspection notes, findings, or concerns..."
                            className="w-full text-sm border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={2}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {/* Inspection Summary */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspection Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Items Checked</span>
              <span className="font-semibold text-gray-900">{completedItems}/{totalItems}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">High Priority Items</span>
              <span className="font-semibold text-gray-900">{completedHighPriority}/{highPriorityItems}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-semibold text-gray-900">{Math.round(progressPercentage)}%</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h3>
          <div className="space-y-3">
            <button 
              onClick={handleDownloadPDF}
              className="w-full bg-blue-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download PDF Checklist
            </button>
            <button 
              onClick={handleShareProgress}
              className="w-full bg-white text-blue-500 py-3 px-6 rounded-xl font-medium border border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Share Progress
            </button>
          </div>
        </div>
      </div>

      {/* Inspection Tips */}
      <div className="bg-blue-50 rounded-2xl border border-blue-200 p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-blue-500">💡</span>
          Inspection Tips
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Take photos of any issues you discover for documentation</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Ask the inspector questions about anything you don't understand</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Focus on high-priority items that could be safety hazards or expensive repairs</span>
            </div>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Bring a flashlight to check dark areas like basements and crawl spaces</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Test all switches, outlets, and faucets yourself during the inspection</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Get a detailed written report with repair cost estimates for major issues</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && <Modal />}

      {/* Info Modal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title={calculatorInfoData["home-inspection"].title}
        description={calculatorInfoData["home-inspection"].description}
        howToUse={calculatorInfoData["home-inspection"].howToUse}
        howToUseTitle={calculatorInfoData["home-inspection"].howToUseTitle}
        terms={calculatorInfoData["home-inspection"].terms}
      />
    </div>
  );
};

export default HomeInspectionChecklist;