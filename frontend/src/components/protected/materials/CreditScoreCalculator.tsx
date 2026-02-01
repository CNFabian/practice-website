import React, { useState } from 'react';
import { OnestFont } from '../../../assets';
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
      return { level: 'Exceptional', color: 'text-status-green bg-status-green/10 border-status-green', range: '800-850' };
    } else if (score >= 740) {
      return { level: 'Very Good', color: 'text-logo-blue bg-logo-blue/10 border-logo-blue', range: '740-799' };
    } else if (score >= 670) {
      return { level: 'Good', color: 'text-elegant-blue bg-elegant-blue/10 border-elegant-blue', range: '670-739' };
    } else if (score >= 580) {
      return { level: 'Fair', color: 'text-status-yellow bg-status-yellow/10 border-status-yellow', range: '580-669' };
    } else {
      return { level: 'Poor', color: 'text-status-red bg-status-red/10 border-status-red', range: '300-579' };
    }
  };

  const currentCategory = getScoreCategory(estimatedScore);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-pure-white rounded-2xl border border-light-background-blue p-6 h-fit relative">
          {/* Info Button */}
          <div className="absolute top-6 right-6">
            <InfoButton onClick={() => setIsInfoModalOpen(true)} />
          </div>
          
          <div className="mb-6 pr-12">
            <div className="w-16 h-16 bg-logo-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
              <img 
                src={ChartIcon} 
                alt="Chart"
                className="w-8 h-8"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <OnestFont as="h2" weight={700} lineHeight="tight" className="text-xl text-text-blue-black text-center mb-2">
              Credit Score Calculator
            </OnestFont>
            <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-center text-sm">
              Estimate your credit score based on key factors
            </OnestFont>
          </div>

          <div className="space-y-6">
            {/* Payment History */}
            <div>
              <OnestFont as="label" weight={500} lineHeight="relaxed" className="block text-sm text-text-blue-black mb-2">
                Payment History (35% weight)
              </OnestFont>
              <select
                value={factors[0].value}
                onChange={(e) => updateFactor('payment', 'value', e.target.value)}
                className="w-full px-4 py-3 border border-light-background-blue rounded-lg focus:ring-2 focus:ring-logo-blue focus:border-transparent"
              >
                <option value="excellent">Excellent - Never missed payments</option>
                <option value="good">Good - 1-2 late payments in 2 years</option>
                <option value="fair">Fair - Several late payments</option>
                <option value="poor">Poor - Frequent missed payments</option>
              </select>
            </div>

            {/* Credit Utilization */}
            <div>
              <OnestFont as="label" weight={500} lineHeight="relaxed" className="block text-sm text-text-blue-black mb-2">
                Credit Utilization (30% weight)
              </OnestFont>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={factors[1].value}
                  onChange={(e) => updateFactor('utilization', 'value', parseInt(e.target.value) || 0)}
                  className="w-full pr-8 pl-4 py-3 border border-light-background-blue rounded-lg focus:ring-2 focus:ring-logo-blue focus:border-transparent"
                  placeholder="25"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-grey">%</span>
              </div>
              <OnestFont weight={300} lineHeight="relaxed" className="text-xs text-text-grey mt-1">
                Percentage of available credit you're using
              </OnestFont>
            </div>

            {/* Credit History Length */}
            <div>
              <OnestFont as="label" weight={500} lineHeight="relaxed" className="block text-sm text-text-blue-black mb-2">
                Credit History Length (15% weight)
              </OnestFont>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={factors[2].value}
                  onChange={(e) => updateFactor('history', 'value', parseInt(e.target.value) || 0)}
                  className="w-full pr-12 pl-4 py-3 border border-light-background-blue rounded-lg focus:ring-2 focus:ring-logo-blue focus:border-transparent"
                  placeholder="5"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-grey">years</span>
              </div>
              <OnestFont weight={300} lineHeight="relaxed" className="text-xs text-text-grey mt-1">
                How long you've had credit accounts
              </OnestFont>
            </div>

            {/* Credit Mix */}
            <div>
              <OnestFont as="label" weight={500} lineHeight="relaxed" className="block text-sm text-text-blue-black mb-2">
                Credit Mix (10% weight)
              </OnestFont>
              <select
                value={factors[3].value}
                onChange={(e) => updateFactor('mix', 'value', e.target.value)}
                className="w-full px-4 py-3 border border-light-background-blue rounded-lg focus:ring-2 focus:ring-logo-blue focus:border-transparent"
              >
                <option value="excellent">Excellent - Multiple types (cards, loans, mortgage)</option>
                <option value="good">Good - Credit cards and one loan type</option>
                <option value="fair">Fair - Only credit cards</option>
                <option value="poor">Poor - Limited credit types</option>
              </select>
            </div>

            {/* New Credit Inquiries */}
            <div>
              <OnestFont as="label" weight={500} lineHeight="relaxed" className="block text-sm text-text-blue-black mb-2">
                Hard Inquiries (10% weight)
              </OnestFont>
              <input
                type="number"
                min="0"
                max="20"
                value={factors[4].value}
                onChange={(e) => updateFactor('inquiries', 'value', parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 border border-light-background-blue rounded-lg focus:ring-2 focus:ring-logo-blue focus:border-transparent"
                placeholder="2"
              />
              <OnestFont weight={300} lineHeight="relaxed" className="text-xs text-text-grey mt-1">
                Number of hard inquiries in the past 2 years
              </OnestFont>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Estimated Score Display */}
          <div className="bg-pure-white rounded-2xl border border-light-background-blue p-6">
            <div className="mb-6">
              <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-lg text-text-blue-black text-center mb-4">
                Estimated Credit Score
              </OnestFont>
              <div className="text-center mb-4">
                <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey mb-2">
                  Based on your credit profile
                </OnestFont>
              </div>
            </div>

            <div className={`rounded-xl p-6 border-2 ${currentCategory.color} text-center mb-6`}>
              <OnestFont weight={700} lineHeight="tight" className="text-5xl mb-2">
                {estimatedScore}
              </OnestFont>
              <OnestFont weight={700} lineHeight="relaxed" className="text-lg mb-1">
                {currentCategory.level}
              </OnestFont>
              <OnestFont weight={300} lineHeight="relaxed" className="text-sm opacity-75">
                {currentCategory.range}
              </OnestFont>
            </div>

            {/* Score Range Visualization */}
            <div className="mb-6">
              <div className="relative">
                <div className="w-full bg-light-background-blue rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full transition-all duration-500 ${
                      estimatedScore >= 800 ? 'bg-status-green' :
                      estimatedScore >= 740 ? 'bg-logo-blue' :
                      estimatedScore >= 670 ? 'bg-elegant-blue' :
                      estimatedScore >= 580 ? 'bg-status-yellow' : 'bg-status-red'
                    }`}
                    style={{ width: `${((estimatedScore - 300) / 550) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-text-grey mt-1">
                  <OnestFont weight={300} lineHeight="relaxed">300</OnestFont>
                  <OnestFont weight={300} lineHeight="relaxed">580</OnestFont>
                  <OnestFont weight={300} lineHeight="relaxed">670</OnestFont>
                  <OnestFont weight={300} lineHeight="relaxed">740</OnestFont>
                  <OnestFont weight={300} lineHeight="relaxed">800</OnestFont>
                  <OnestFont weight={300} lineHeight="relaxed">850</OnestFont>
                </div>
              </div>
            </div>

            {/* Factor Breakdown */}
            <div className="space-y-3">
              <OnestFont as="h4" weight={700} lineHeight="relaxed" className="text-text-blue-black">
                Credit Score Factors
              </OnestFont>
              {factors.map((factor) => (
                <div key={factor.id} className="flex justify-between items-center">
                  <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-text-grey">
                    {factor.label}
                  </OnestFont>
                  <div className="flex items-center gap-2">
                    <OnestFont weight={500} lineHeight="relaxed" className="text-sm">
                      {factor.weight}%
                    </OnestFont>
                    <div className={`w-3 h-3 rounded-full ${
                      factor.id === 'payment' ? 'bg-status-red' :
                      factor.id === 'utilization' ? 'bg-status-yellow' :
                      factor.id === 'history' ? 'bg-logo-blue' :
                      factor.id === 'mix' ? 'bg-status-green' : 'bg-elegant-blue'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

      

          {/* General Tips */}
          <div className="bg-status-green/10 border border-status-green rounded-2xl p-6">
            <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-lg text-status-green mb-3">
              💡 General Credit Tips
            </OnestFont>
            <div className="space-y-3 text-sm text-text-blue-black">
              <div className="flex items-start gap-2">
                <span className="text-status-green mt-1">✓</span>
                <OnestFont weight={300} lineHeight="relaxed">Monitor your credit report regularly for errors</OnestFont>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-status-green mt-1">✓</span>
                <OnestFont weight={300} lineHeight="relaxed">Keep credit card balances low</OnestFont>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-status-green mt-1">✓</span>
                <OnestFont weight={300} lineHeight="relaxed">Don't close old credit accounts</OnestFont>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-status-green mt-1">✓</span>
                <OnestFont weight={300} lineHeight="relaxed">Limit new credit applications</OnestFont>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Interpretation */}
      <div className="bg-pure-white rounded-2xl border border-light-background-blue p-6">
        <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-lg text-text-blue-black mb-6">
          What Your Score Means
        </OnestFont>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {[
            { range: '300-579', level: 'Poor', color: 'bg-status-red/10 text-status-red border border-status-red', description: 'Difficulty obtaining credit' },
            { range: '580-669', level: 'Fair', color: 'bg-status-yellow/10 text-status-yellow border border-status-yellow', description: 'Higher rates and strict terms' },
            { range: '670-739', level: 'Good', color: 'bg-elegant-blue/10 text-elegant-blue border border-elegant-blue', description: 'Fair rates offered by most' },
            { range: '740-799', level: 'Very Good', color: 'bg-logo-blue/10 text-logo-blue border border-logo-blue', description: 'Good rates and terms' },
            { range: '800-850', level: 'Exceptional', color: 'bg-status-green/10 text-status-green border border-status-green', description: 'Best rates and terms' }
          ].map((category) => (
            <div key={category.range} className={`p-3 rounded-xl ${category.color}`}>
              <OnestFont weight={700} lineHeight="relaxed" className="text-sm mb-1">
                {category.level}
              </OnestFont>
              <OnestFont weight={500} lineHeight="relaxed" className="text-xs mb-2 block">
                {category.range}
              </OnestFont>
              <OnestFont weight={300} lineHeight="relaxed" className="text-xs">
                {category.description}
              </OnestFont>
            </div>
          ))}
        </div>
        {currentCategory.level !== 'Exceptional' && (
          <div className="mt-6 p-4 bg-logo-blue/10 border border-logo-blue rounded-xl">
            <OnestFont weight={300} lineHeight="relaxed" className="text-sm text-logo-blue">
              <span className="font-semibold">Keep improving!</span> Continue monitoring and enhancing your credit habits to reach the next level and unlock better rates and terms.
            </OnestFont>
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