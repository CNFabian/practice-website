import React, { useState } from 'react';

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
      description: 'Verify GFCI outlets in bathrooms, kitchen, and exterior.',
      category: 'Electrical System',
      priority: 'High',
      completed: false
    },
    {
      id: 'lighting-fixtures',
      title: 'Lighting Fixtures',
      description: 'Test all light fixtures and ceiling fans.',
      category: 'Electrical System',
      priority: 'Low',
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
      id: 'hot-water-heater',
      title: 'Water Heater',
      description: 'Check age, condition, and proper installation.',
      category: 'Plumbing System',
      priority: 'High',
      completed: false
    },
    {
      id: 'pipes-leaks',
      title: 'Visible Pipes',
      description: 'Look for leaks, corrosion, or improper installation.',
      category: 'Plumbing System',
      priority: 'High',
      completed: false
    },
    {
      id: 'toilets-fixtures',
      title: 'Toilets and Fixtures',
      description: 'Test operation and check for leaks or damage.',
      category: 'Plumbing System',
      priority: 'Medium',
      completed: false
    },
    {
      id: 'drainage',
      title: 'Drainage',
      description: 'Test all drains for proper drainage and no clogs.',
      category: 'Plumbing System',
      priority: 'Medium',
      completed: false
    },

    // HVAC System
    {
      id: 'heating-system',
      title: 'Heating System',
      description: 'Test heating system operation and efficiency.',
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

  const toggleItem = (id: string) => {
    setInspectionItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const updateNotes = (id: string, note: string) => {
    setNotes(prev => ({ ...prev, [id]: note }));
  };

  const categories = [...new Set(inspectionItems.map(item => item.category))];
  const completedItems = inspectionItems.filter(item => item.completed).length;
  const totalItems = inspectionItems.length;
  const progressPercentage = (completedItems / totalItems) * 100;

  const priorityColors = {
    High: 'text-red-600 bg-red-50 border-red-200',
    Medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    Low: 'text-blue-600 bg-blue-50 border-blue-200'
  };

  const getPriorityStats = () => {
    const highPriority = inspectionItems.filter(item => item.priority === 'High');
    const highCompleted = highPriority.filter(item => item.completed).length;
    return { total: highPriority.length, completed: highCompleted };
  };

  const priorityStats = getPriorityStats();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
            <span className="text-white text-2xl">🔍</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Home Inspection Checklist
            </h1>
            <p className="text-gray-600">
              Comprehensive checklist to ensure you don't miss any important details during your home inspection
            </p>
          </div>
        </div>

        {/* Progress and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Overall Progress
              </span>
              <span className="text-sm font-medium text-blue-600">
                {completedItems}/{totalItems} ({Math.round(progressPercentage)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Priority Items */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                High Priority Items
              </span>
              <span className="text-sm font-medium text-red-600">
                {priorityStats.completed}/{priorityStats.total}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-red-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(priorityStats.completed / priorityStats.total) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Inspection Items by Category */}
      <div className="space-y-8">
        {categories.map((category) => {
          const categoryItems = inspectionItems.filter(item => item.category === category);
          const categoryCompleted = categoryItems.filter(item => item.completed).length;
          
          return (
            <div key={category} className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">{category}</h2>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    {categoryCompleted}/{categoryItems.length} completed
                  </span>
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(categoryCompleted / categoryItems.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {categoryItems.map((item) => (
                  <div 
                    key={item.id}
                    className={`border rounded-lg p-4 transition-all duration-200 ${
                      item.completed 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div 
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 cursor-pointer ${
                          item.completed 
                            ? 'border-green-500 bg-green-500' 
                            : 'border-gray-300'
                        }`}
                        onClick={() => toggleItem(item.id)}
                      >
                        {item.completed && (
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className={`font-semibold ${
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
              <span className="text-gray-600">High Priority Completed</span>
              <span className="font-semibold text-red-600">{priorityStats.completed}/{priorityStats.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Overall Completion</span>
              <span className="font-semibold text-blue-600">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Items with Notes</span>
                <span className="font-semibold text-gray-900">
                  {Object.values(notes).filter(note => note.trim()).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Inspection Report
            </button>
            <button className="w-full bg-white text-blue-600 py-3 px-6 rounded-xl font-medium border border-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              Share with Agent
            </button>
            <button className="w-full bg-white text-gray-600 py-3 px-6 rounded-xl font-medium border border-gray-300 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Save Progress
            </button>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspection Tips</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">💡</span>
              <span>Take photos of any issues you discover for documentation</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">💡</span>
              <span>Ask the inspector questions about anything you don't understand</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">💡</span>
              <span>Focus on high-priority items that could be safety hazards or expensive repairs</span>
            </div>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">💡</span>
              <span>Bring a flashlight to check dark areas like basements and crawl spaces</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">💡</span>
              <span>Test all switches, outlets, and faucets yourself during the inspection</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-500 mt-1">💡</span>
              <span>Get a detailed written report with repair cost estimates for major issues</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeInspectionChecklist;