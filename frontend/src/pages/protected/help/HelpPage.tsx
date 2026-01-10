import React, { useEffect, useState } from 'react';
import { RobotoFont } from '../../../assets';
import { TabNavigation, FAQSection, ContactForm } from './components';

const HelpPage: React.FC = () => {

  useEffect(() => {
  const bgElement = document.getElementById('section-background');
  if (bgElement) {
    bgElement.style.setProperty('background', 'rgb(224, 231, 255)', 'important');
    bgElement.style.backgroundSize = 'cover';
  }
}, []);

  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');

  return (
    <div className="p-6 max-w-8xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <RobotoFont as="h1" weight={700} className="text-xl lg:text-2xl text-gray-900 mb-3 mt-3">
          Help Center
        </RobotoFont>
        <RobotoFont as="p" weight={400} className="text-base text-gray-600 leading-relaxed">
          Find answers to common questions, explore our platform through demos, and get the support you need on your homebuying journey. We're here to help you succeed.
        </RobotoFont>
      </div>

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'faq' && <FAQSection />}
      {activeTab === 'contact' && <ContactForm />}
    </div>
  );
};

export default HelpPage;