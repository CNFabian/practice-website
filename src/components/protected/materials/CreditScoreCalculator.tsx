import React, { useState } from 'react';
import RobotoFont from '../../../assets/fonts';
import { ChartIcon } from '../../../assets';
import InfoButton from './InfoButton';
import InfoModal from './InfoModal';
import { calculatorInfoData } from './InfoData';

interface CreditFactor {
  id: string;
  label: string;
  weight: number;
  value: string | number;
  min?: number;
  max?: number;
}

const CreditScoreCalculator: React.FC = () => {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [factors, setFactors] = useState<CreditFactor[]>([
    {
      id: 'payment',
      label: 'Payment History',
      weight: 35,
      value: 'good'
    },
    {
      id: 'utilization',
      label: 'Credit Utilization',
      weight: 30,
      value: 25
    },
    {
      id: 'history',
      label: 'Credit History Length',
      weight: 15,
      value: 5
    },
    {
      id: 'mix',
      label: 'Credit Mix',
      weight: 10,
      value: 'good'
    },
    {
      id: 'inquiries',
      label: 'New Credit Inquiries',
      weight: 10,
      value: 2,
      min: 0,
      max: 20
    }
  ]);

  const calculateCreditScore = (): number => {
    const minScore = 300;
    const maxScore = 850;
    let totalScore = 0;

    factors.forEach(factor => {
      const weightedContribution = (factor.weight / 100) * (maxScore - minScore);
      let factorScore = 0;

      switch (factor.id) {
        case 'payment':
          const paymentValue = factor.value as string;
          if (paymentValue === 'excellent') factorScore = 1.0;
          else if (paymentValue === 'good') factorScore = 0.8;
          else if (paymentValue === 'fair') factorScore = 0.5;
          else factorScore = 0.2;
          break;

        case 'utilization':
          const utilizationValue = factor.value as number;
          if (utilizationValue <= 10) factorScore = 1.0;
          else if (utilizationValue <= 30) factorScore = 0.7;
          else if (utilizationValue <= 50) factorScore = 0.5;
          else if (utilizationValue <= 70) factorScore = 0.3;
          else factorScore = 0.1;
          break;

        case 'history':
          const historyValue = factor.value as number;
          if (historyValue >= 10) factorScore = 1.0;
          else if (historyValue >= 7) factorScore = 0.8;
          else if (historyValue >= 3) factorScore = 0.6;
          else if (historyValue >= 1) factorScore = 0.4;
          else factorScore = 0.2;
          break;

        case 'mix':
          const mixValue = factor.value as string;
          if (mixValue === 'excellent') factorScore = 1.0;
          else if (mixValue === 'good') factorScore = 0.8;
          else if (mixValue === 'fair') factorScore = 0.6;
          else factorScore = 0.4;
          break;

        case 'inquiries':
          const inquiriesValue = factor.value as number;
          if (inquiriesValue === 0) factorScore = 1.0;
          else if (inquiriesValue <= 2) factorScore = 0.8;
          else if (inquiriesValue <= 5) factorScore = 0.6;
          else if (inquiriesValue <= 10) factorScore = 0.4;
          else factorScore = 0.2;
          break;
      }

      totalScore += weightedContribution * factorScore;
    });

    return Math.round(minScore + totalScore);
  };

  const updateFactor = (id: string, field: string, value: string | number) => {
    const validatedValue = typeof value === 'number' ? 
      Math.max(0, Math.min(value, field === 'utilization' ? 100 : field === 'history' ? 50 : 20)) : value;
    
    setFactors(prev => prev.map(factor => 
      factor.id === id ? { ...factor, [field]: validatedValue } : factor
    ));
  };

  const estimatedScore = calculateCreditScore();

  const getScoreCategory = (score: number): { level: string; color: string; range: string } => {
    if (score >= 800) {
      return { level: 'Exceptional', color: 'text-green-600 bg-green-50 border-green-200', range: '800-850' };
    } else if (score >= 740) {
      return { level: 'Very Good', color: 'text-blue-600 bg-blue-50 border-blue-200', range: '740-799' };
    } else if (score >= 670) {
      return { level: 'Good', color: 'text-indigo-600 bg-indigo-50 border-indigo-200', range: '670-739' };
    } else if (score >= 580) {
      return { level: 'Fair', color: 'text-yellow-600 bg-yellow-50 border-yellow-200', range: '580-669' };
    } else {
      return { level: 'Poor', color: 'text-red-600 bg-red-50 border-red-200', range: '300-579' };
    }
  };

  const currentCategory = getScoreCategory(estimatedScore);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 h-fit relative">
          {/* Info Button */}
          <div className="absolute top-6 right-6">
            <InfoButton onClick={() => setIsInfoModalOpen(true)} />
          </div>
          
          <div className="mb-6 pr-12">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <img 
                src={ChartIcon} 
                alt="Chart"
                className="w-8 h-8"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <RobotoFont as="h2" weight={700} className="text-xl text-gray-900 text-center mb-2">
              Credit Score Calculator
            </RobotoFont>
            <RobotoFont className="text-gray-600 text-center text-sm">
              Estimate your credit score based on key factors
            </RobotoFont>
          </div>

          <div className="space-y-6">
            {/* Payment History */}
            <div>
              <RobotoFont as="label" weight={500} className="block text-sm text-gray-700 mb-2">
                Payment History (35% weight)
              </RobotoFont>
              <select
                value={factors[0].value}
                onChange={(e) => updateFactor('payment', 'value', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="excellent">Excellent - Never missed payments</option>
                <option value="good">Good - 1-2 late payments in 2 years</option>
                <option value="fair">Fair - Several late payments</option>
                <option value="poor">Poor - Frequent missed payments</option>
              </select>
            </div>

            {/* Credit Utilization */}
            <div>
              <RobotoFont as="label" weight={500} className="block text-sm text-gray-700 mb-2">
                Credit Utilization (30% weight)
              </RobotoFont>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={factors[1].value}
                  onChange={(e) => updateFactor('utilization', 'value', parseInt(e.target.value) || 0)}
                  className="w-full pr-8 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="25"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
              </div>
              <RobotoFont className="text-xs text-gray-500 mt-1">
                Percentage of available credit you're using
              </RobotoFont>
            </div>

            {/* Credit History Length */}
            <div>
              <RobotoFont as="label" weight={500} className="block text-sm text-gray-700 mb-2">
                Credit History Length (15% weight)
              </RobotoFont>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={factors[2].value}
                  onChange={(e) => updateFactor('history', 'value', parseInt(e.target.value) || 0)}
                  className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">years</span>
              </div>
              <RobotoFont className="text-xs text-gray-500 mt-1">
                How long you've had credit accounts
              </RobotoFont>
            </div>

            {/* Credit Mix */}
            <div>
              <RobotoFont as="label" weight={500} className="block text-sm text-gray-700 mb-2">
                Credit Mix (10% weight)
              </RobotoFont>
              <select
                value={factors[3].value}
                onChange={(e) => updateFactor('mix', 'value', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="excellent">Excellent - Multiple types (cards, loans, mortgage)</option>
                <option value="good">Good - Credit cards and one loan type</option>
                <option value="fair">Fair - Only credit cards</option>
                <option value="poor">Poor - Limited credit types</option>
              </select>
            </div>

            {/* New Credit Inquiries */}
            <div>
              <RobotoFont as="label" weight={500} className="block text-sm text-gray-700 mb-2">
                Hard Inquiries (10% weight)
              </RobotoFont>
              <input
                type="number"
                min="0"
                max="20"
                value={factors[4].value}
                onChange={(e) => updateFactor('inquiries', 'value', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="2"
              />
              <RobotoFont className="text-xs text-gray-500 mt-1">
                Number of hard inquiries in the past 2 years
              </RobotoFont>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Estimated Score Display */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="mb-6">
              <RobotoFont as="h3" weight={600} className="text-lg text-gray-900 text-center mb-4">
                Estimated Credit Score
              </RobotoFont>
              <div className="text-center mb-4">
                <RobotoFont className="text-sm text-gray-500 mb-2">
                  Based on your credit profile
                </RobotoFont>
              </div>
            </div>

            <div className={`rounded-xl p-6 border-2 ${currentCategory.color} text-center mb-6`}>
              <RobotoFont weight={700} className="text-5xl mb-2">
                {estimatedScore}
              </RobotoFont>
              <RobotoFont weight={600} className="text-lg mb-1">
                {currentCategory.level}
              </RobotoFont>
              <RobotoFont className="text-sm opacity-75">
                {currentCategory.range}
              </RobotoFont>
            </div>

            {/* Score Range Visualization */}
            <div className="mb-6">
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full transition-all duration-500 ${
                      estimatedScore >= 800 ? 'bg-green-500' :
                      estimatedScore >= 740 ? 'bg-blue-500' :
                      estimatedScore >= 670 ? 'bg-indigo-500' :
                      estimatedScore >= 580 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${((estimatedScore - 300) / 550) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <RobotoFont>300</RobotoFont>
                  <RobotoFont>580</RobotoFont>
                  <RobotoFont>670</RobotoFont>
                  <RobotoFont>740</RobotoFont>
                  <RobotoFont>800</RobotoFont>
                  <RobotoFont>850</RobotoFont>
                </div>
              </div>
            </div>

            {/* Factor Breakdown */}
            <div className="space-y-3">
              <RobotoFont as="h4" weight={600} className="text-gray-900">
                Credit Score Factors
              </RobotoFont>
              {factors.map((factor) => (
                <div key={factor.id} className="flex justify-between items-center">
                  <RobotoFont className="text-sm text-gray-600">
                    {factor.label}
                  </RobotoFont>
                  <div className="flex items-center gap-2">
                    <RobotoFont weight={500} className="text-sm">
                      {factor.weight}%
                    </RobotoFont>
                    <div className={`w-3 h-3 rounded-full ${
                      factor.id === 'payment' ? 'bg-red-400' :
                      factor.id === 'utilization' ? 'bg-orange-400' :
                      factor.id === 'history' ? 'bg-blue-400' :
                      factor.id === 'mix' ? 'bg-green-400' : 'bg-purple-400'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

      

          {/* General Tips */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <RobotoFont as="h3" weight={600} className="text-lg text-green-900 mb-3">
              💡 General Credit Tips
            </RobotoFont>
            <div className="space-y-3 text-sm text-green-800">
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <RobotoFont>Monitor your credit report regularly for errors</RobotoFont>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <RobotoFont>Keep credit card balances low</RobotoFont>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <RobotoFont>Don't close old credit accounts</RobotoFont>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <RobotoFont>Limit new credit applications</RobotoFont>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Interpretation */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <RobotoFont as="h3" weight={600} className="text-lg text-gray-900 mb-6">
          What Your Score Means
        </RobotoFont>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {[
            { range: '300-579', level: 'Poor', color: 'bg-red-100 text-red-800 border border-red-200', description: 'Difficulty obtaining credit' },
            { range: '580-669', level: 'Fair', color: 'bg-yellow-100 text-yellow-800 border border-yellow-200', description: 'Higher rates and strict terms' },
            { range: '670-739', level: 'Good', color: 'bg-indigo-100 text-indigo-800 border border-indigo-200', description: 'Fair rates offered by most' },
            { range: '740-799', level: 'Very Good', color: 'bg-blue-100 text-blue-800 border border-blue-200', description: 'Good rates and terms' },
            { range: '800-850', level: 'Exceptional', color: 'bg-green-100 text-green-800 border border-green-200', description: 'Best rates and terms' }
          ].map((category) => (
            <div key={category.range} className={`p-3 rounded-xl ${category.color}`}>
              <RobotoFont weight={600} className="text-sm mb-1">
                {category.level}
              </RobotoFont>
              <RobotoFont weight={500} className="text-xs mb-2 block">
                {category.range}
              </RobotoFont>
              <RobotoFont className="text-xs">
                {category.description}
              </RobotoFont>
            </div>
          ))}
        </div>
        {currentCategory.level !== 'Exceptional' && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <RobotoFont className="text-sm text-blue-800">
              <span className="font-semibold">Keep improving!</span> Continue monitoring and enhancing your credit habits to reach the next level and unlock better rates and terms.
            </RobotoFont>
          </div>
        )}
      </div>

      {/* Info Modal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title={calculatorInfoData["credit-score"].title}
        description={calculatorInfoData["credit-score"].description}
        howToUse={calculatorInfoData["credit-score"].howToUse}
        howToUseTitle={calculatorInfoData["credit-score"].howToUseTitle}
        terms={calculatorInfoData["credit-score"].terms}
      />
    </div>
  );
};

export default CreditScoreCalculator;