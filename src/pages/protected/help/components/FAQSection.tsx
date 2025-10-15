import React, { useState } from 'react';
import { RobotoFont } from '../../../../assets';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const FAQSection: React.FC = () => {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      id: 1,
      question: "What is Nest Navigate and how does it work?",
      answer: "Nest Navigate is a comprehensive homebuying education platform designed to guide you through every step of the home purchasing process. We provide interactive modules, financial calculators, worksheets, and expert guidance to help you make informed decisions. Our platform works by breaking down complex homebuying concepts into digestible lessons, allowing you to learn at your own pace while earning Nest Coins for completing activities."
    },
    {
      id: 2,
      question: "What are Nest Coins and how can I use them?",
      answer: "Nest Coins are our platform's reward currency that you earn by completing lessons, quizzes, and other activities. You can use Nest Coins in our Rewards Shop to purchase valuable items that help with your homebuying journey, such as gift cards for home improvement stores, consultation credits, and exclusive resources. The more you learn and engage with our platform, the more coins you earn!"
    },
    {
      id: 3,
      question: "Do I really need 20% down to buy a home?",
      answer: "No, you don't need 20% down to buy a home! While 20% is often recommended to avoid private mortgage insurance (PMI), many loan programs allow much lower down payments. FHA loans require as little as 3.5% down, VA loans offer 0% down for qualified veterans, and conventional loans can go as low as 3% down. Our platform includes detailed modules about different loan types and down payment options to help you find the best fit for your situation."
    },
    {
      id: 4,
      question: "How do I earn rewards and what can I use them for?",
      answer: "You earn Nest Coins by completing various activities on our platform: finishing lessons (+25 coins), completing modules (+100 coins), taking quizzes (+50 coins), and achieving milestones. You can redeem these coins in our Rewards Shop for items like Home Depot gift cards, free credit reports, real estate consultation sessions, and exclusive homebuying resources. Check your progress on the dashboard to see your current coin balance!"
    },
    {
      id: 5,
      question: "Are the calculators and tools accurate for my specific situation?",
      answer: "Our calculators provide accurate estimates based on the information you input and current market standards. However, they are designed for educational purposes and initial planning. For your specific situation, we recommend consulting with licensed mortgage professionals, real estate agents, and financial advisors. Our calculators are excellent starting points to understand concepts like mortgage payments, debt-to-income ratios, and affordability, but final decisions should always involve professional guidance."
    },
    {
      id: 6,
      question: "What if I'm not ready to buy a home for several years?",
      answer: "That's perfectly fine! Nest Navigate is designed for learners at all stages of their homebuying journey. If you're planning to buy in several years, our platform is ideal for building your knowledge foundation early. You can focus on modules about credit improvement, savings strategies, and market understanding. Use our budgeting worksheets to create a savings plan, and track your progress over time. Starting early gives you a significant advantage in preparing for homeownership."
    },
    {
      id: 7,
      question: "How is my personal financial information protected?",
      answer: "We take your privacy and security very seriously. All personal financial information is encrypted and stored securely using industry-standard security protocols. We never share your personal data with third parties without your explicit consent. Our calculators and tools process information locally in your browser when possible, and any data stored on our servers is protected with bank-level encryption. You can review our complete privacy policy for detailed information about how we handle your data."
    },
    {
      id: 8,
      question: "Can I save my progress and calculator results?",
      answer: "Yes! Your learning progress is automatically saved as you complete lessons and modules. For calculator results, you can print or save the results to your device. We're working on enhanced features that will allow you to save and track multiple calculation scenarios directly in your account. Your completed checklists and worksheet progress are also saved to help you track your homebuying journey over time."
    }
  ];

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  return (
    <div>
      <RobotoFont as="h2" weight={600} className="text-xl text-gray-900 mb-6">
        Find answers to all of our most frequently asked questions.
      </RobotoFont>
      
      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm">
            <button
              onClick={() => toggleFAQ(item.id)}
              className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 transition-colors"
            >
              <RobotoFont as="span" weight={500} className="text-base text-gray-900 flex-1 pr-4">
                {item.question}
              </RobotoFont>
              <div className="flex-shrink-0">
                <svg
                  className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${
                    expandedFAQ === item.id ? 'rotate-45' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </div>
            </button>
            
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
              expandedFAQ === item.id ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
            }`}>
              <div className="px-6 py-4 bg-gray-100">
                <RobotoFont as="p" weight={400} className="text-sm text-gray-700 leading-relaxed">
                  {item.answer}
                </RobotoFont>
              </div>
            </div>
            
            {index < faqItems.length - 1 && (
              <div className="h-px bg-gray-200"></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQSection;