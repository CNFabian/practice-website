import React, { useEffect, useState } from 'react';
import { OnestFont } from '../../../assets';
import { TabNavigation, FAQSection, ContactForm } from '../components';

const HelpPage: React.FC = () => {

  useEffect(() => {
  const bgElement = document.getElementById('section-background');
  if (bgElement) {
    bgElement.className = 'bg-light-background-blue';
    bgElement.style.backgroundSize = 'cover';
  }
}, []);

  const [activeTab, setActiveTab] = useState<'faq' | 'contact'>('faq');

  return (
    <div className="p-6 max-w-8xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <OnestFont as="h1" weight={700} lineHeight="tight" className="text-xl lg:text-2xl text-text-blue-black mb-3 mt-3">
          Help Center
        </OnestFont>
        <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-base text-text-grey leading-relaxed">
          Find answers to common questions, explore our platform through demos, and get the support you need on your homebuying journey. We're here to help you succeed.
        </OnestFont>
      </div>

      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'faq' && <FAQSection />}
      {activeTab === 'contact' && <ContactForm />}
    </div>
  );
};

export default HelpPage;