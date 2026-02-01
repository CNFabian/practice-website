import React, { useState } from 'react';
import { OnestFont } from '../../../assets';
import InfoButton from './InfoButton';
import InfoModal from './InfoModal';

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

  const checklistInfoData = {
    title: 'Home Inspection Checklist',
    description: 'Comprehensive checklist to ensure you don\'t miss critical areas during inspection.',
    howToUse: [
      'Schedule the inspection after your offer is accepted',
      'Attend the inspection to ask questions and take notes',
      'Check each system methodically (electrical, plumbing, HVAC)',
      'Document any issues with photos and detailed descriptions',
      'Review findings with the inspector before they leave',
      'Use results to negotiate repairs or price adjustments'
    ],
    howToUseTitle: 'How to Conduct a Thorough Inspection',
    terms: [
      {
        term: 'HVAC System',
        definition: 'Heating, Ventilation, and Air Conditioning system'
      },
      {
        term: 'Foundation Issues',
        definition: 'Problems with the structural base of the home'
      },
      {
        term: 'Code Violations',
        definition: 'Areas that don\'t meet current building code standards'
      },
      {
        term: 'Contingency Period',
        definition: 'Time allowed to complete inspection and request repairs'
      }
    ]
  };

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
    High: 'bg-status-red/10 text-status-red border-status-red',
    Medium: 'bg-status-yellow/10 text-status-yellow border-status-yellow',
    Low: 'bg-status-green/10 text-status-green border-status-green'
  };

  const Modal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl bg-pure-white shadow-2xl ring-1 ring-black/5 p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🚧</div>
          <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-xl text-text-blue-black mb-2">Feature Under Development</OnestFont>
          <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey mb-6">This feature is currently being developed and will be available soon.</OnestFont>
          <button 
            onClick={() => setShowModal(false)}
            className="w-full bg-elegant-blue text-pure-white py-3 px-6 rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <OnestFont weight={500} lineHeight="relaxed">
              Got it
            </OnestFont>
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
        
        <OnestFont as="h1" weight={700} lineHeight="tight" className="text-3xl text-text-blue-black mb-3 pr-12">
          Home Inspection Checklist
        </OnestFont>
        <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey">
          Use this comprehensive checklist during your home inspection to ensure you don't miss any critical areas. 
          Take notes and mark items as you inspect them.
        </OnestFont>
        
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <OnestFont weight={500} lineHeight="relaxed" className="text-sm text-text-blue-black">Inspection Progress</OnestFont>
            <OnestFont weight={500} lineHeight="relaxed" className="text-sm text-text-blue-black">
              {completedItems}/{totalItems} items checked
            </OnestFont>
          </div>
          <div className="w-full bg-light-background-blue rounded-full h-3">
            <div 
              className="bg-elegant-blue h-3 rounded-full transition-all duration-300"
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
            <div key={group.name} className="bg-pure-white rounded-2xl border border-light-background-blue p-6">
              <div className="flex justify-between items-center mb-6">
                <OnestFont as="h2" weight={700} lineHeight="relaxed" className="text-xl text-text-blue-black">
                  {group.name}
                </OnestFont>
                <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey">
                  {categoryCompleted}/{group.items.length} completed
                </OnestFont>
              </div>
              
              <div className="space-y-4">
                {group.items.map((item) => (
                  <div 
                    key={item.id}
                    className="border border-light-background-blue rounded-xl p-4 hover:border-elegant-blue transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <div 
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                            item.completed 
                              ? 'bg-elegant-blue border-elegant-blue' 
                              : 'border-unavailable-button hover:border-elegant-blue'
                          }`}
                          onClick={() => toggleItem(item.id)}
                        >
                          {item.completed && (
                            <svg className="w-3 h-3 text-pure-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <OnestFont as="h3" weight={500} lineHeight="relaxed" className={`${
                            item.completed ? 'text-status-green line-through' : 'text-text-blue-black'
                          }`}>
                            {item.title}
                          </OnestFont>
                          <OnestFont weight={500} lineHeight="relaxed" className={`px-2 py-1 text-xs rounded-full border ${priorityColors[item.priority]}`}>
                            {item.priority}
                          </OnestFont>
                        </div>
                        <OnestFont weight={300} lineHeight="relaxed" className={`text-sm mb-3 ${
                          item.completed ? 'text-status-green' : 'text-text-grey'
                        }`}>
                          {item.description}
                        </OnestFont>
                        
                        {/* Notes Section */}
                        <div className="mt-3">
                          <OnestFont as="label" weight={500} lineHeight="relaxed" className="block text-xs text-text-grey mb-1">
                            Notes:
                          </OnestFont>
                          <textarea
                            value={notes[item.id] || ''}
                            onChange={(e) => updateNotes(item.id, e.target.value)}
                            placeholder="Add inspection notes, findings, or concerns..."
                            className="w-full text-sm border border-light-background-blue rounded-lg p-2 focus:ring-2 focus:ring-elegant-blue focus:border-transparent resize-none"
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
        <div className="bg-pure-white rounded-2xl border border-light-background-blue p-6">
          <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-lg text-text-blue-black mb-4">Inspection Summary</OnestFont>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey">Total Items Checked</OnestFont>
              <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black">{completedItems}/{totalItems}</OnestFont>
            </div>
            <div className="flex justify-between items-center">
              <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey">High Priority Items</OnestFont>
              <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black">{completedHighPriority}/{highPriorityItems}</OnestFont>
            </div>
            <div className="flex justify-between items-center">
              <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey">Overall Progress</OnestFont>
              <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black">{Math.round(progressPercentage)}%</OnestFont>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-pure-white rounded-2xl border border-light-background-blue p-6">
          <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-lg text-text-blue-black mb-4">Additional Resources</OnestFont>
          <div className="space-y-3">
            <button 
              onClick={handleDownloadPDF}
              className="w-full bg-elegant-blue text-pure-white py-3 px-6 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <OnestFont weight={500} lineHeight="relaxed">Download PDF Checklist</OnestFont>
            </button>
            <button 
              onClick={handleShareProgress}
              className="w-full bg-pure-white text-elegant-blue py-3 px-6 rounded-xl border border-elegant-blue hover:bg-elegant-blue/10 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              <OnestFont weight={500} lineHeight="relaxed">Share Progress</OnestFont>
            </button>
          </div>
        </div>
      </div>

      {/* Inspection Tips */}
      <div className="bg-elegant-blue/10 rounded-2xl border border-elegant-blue p-6 mt-8">
        <OnestFont as="h3" weight={500} lineHeight="relaxed" className="text-lg text-text-blue-black mb-4 flex items-center gap-2">
          <span className="text-elegant-blue">💡</span>
          Inspection Tips
        </OnestFont>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3 text-sm text-text-grey">
            <div className="flex items-start gap-2">
              <span className="text-elegant-blue mt-1">•</span>
              <OnestFont weight={500} lineHeight="relaxed">Take photos of any issues you discover for documentation</OnestFont>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-elegant-blue mt-1">•</span>
              <OnestFont weight={500} lineHeight="relaxed">Ask the inspector questions about anything you don't understand</OnestFont>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-elegant-blue mt-1">•</span>
              <OnestFont weight={500} lineHeight="relaxed">Focus on high-priority items that could be safety hazards or expensive repairs</OnestFont>
            </div>
          </div>
          <div className="space-y-3 text-sm text-text-grey">
            <div className="flex items-start gap-2">
              <span className="text-elegant-blue mt-1">•</span>
              <OnestFont weight={500} lineHeight="relaxed">Bring a flashlight to check dark areas like basements and crawl spaces</OnestFont>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-elegant-blue mt-1">•</span>
              <OnestFont weight={500} lineHeight="relaxed">Test all switches, outlets, and faucets yourself during the inspection</OnestFont>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-elegant-blue mt-1">•</span>
              <OnestFont weight={500} lineHeight="relaxed">Get a detailed written report with repair cost estimates for major issues</OnestFont>
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
        title={checklistInfoData.title}
        description={checklistInfoData.description}
        howToUse={checklistInfoData.howToUse}
        howToUseTitle={checklistInfoData.howToUseTitle}
        terms={checklistInfoData.terms}
      />
    </div>
  );
};

export default HomeInspectionChecklist;