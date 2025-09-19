import React, { Fragment } from 'react';
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from '@headlessui/react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  howToUse: string[];
  howToUseTitle?: string; // Optional custom title for the "How to Use" section
  terms: {
    term: string;
    definition: string;
  }[];
}

const InfoModal: React.FC<InfoModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  howToUse,
  howToUseTitle = "How to Use", // Default fallback title
  terms
}) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <DialogTitle
                      as="h3"
                      className="text-2xl font-bold text-gray-900 mb-2"
                    >
                      {title}
                    </DialogTitle>
                    <p className="text-gray-600">
                      {description}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="ml-4 text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={onClose}
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* How to Use Section */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-blue-600">📋</span>
                      {howToUseTitle}
                    </h4>
                    <div className="bg-blue-50 rounded-xl p-4">
                      <ol className="space-y-2">
                        {howToUse.map((step, index) => (
                          <li key={index} className="flex items-start gap-3 text-sm text-gray-700">
                            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full text-xs font-medium flex items-center justify-center mt-0.5">
                              {index + 1}
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {/* Terms & Definitions Section */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="text-green-600">📖</span>
                      Terms & Definitions
                    </h4>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="space-y-4">
                        {terms.map((term, index) => (
                          <div key={index} className="border-b border-gray-200 last:border-b-0 pb-3 last:pb-0">
                            <dt className="text-sm font-semibold text-gray-900 mb-1">
                              {term.term}
                            </dt>
                            <dd className="text-sm text-gray-600">
                              {term.definition}
                            </dd>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-lg border border-transparent bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 transition-colors"
                    onClick={onClose}
                  >
                    Got it!
                  </button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default InfoModal;