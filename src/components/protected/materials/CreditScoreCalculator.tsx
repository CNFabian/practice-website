import React, { useState } from 'react';
import InfoButton from './InfoButton';
import InfoModal from './InfoModal';
import { calculatorInfoData } from './InfoData';
import { ChartIcon } from '../../../assets';

interface CreditFactor {
  id: string;
  label: string;
  weight: number;
  value: any;
  inputType: 'select' | 'number' | 'range';
  options?: { value: any; label: string }[];
  min?: number;
  max?: number;
}

interface Improvement {
  factor: string;
  impact: 'High' | 'Medium' | 'Low';
  suggestion: string;
}

const CreditScoreCalculator: React.FC = () => {
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  
  const [factors, setFactors] = useState<CreditFactor[]>([
    {
      id: 'payment',
      label: 'Payment History',
      weight: 35,
      value: 'good',
      inputType: 'select',
      options: [
        { value: 'excellent', label: 'Never missed payments' },
        { value: 'good', label: '1-2 late payments ever' },
        { value: 'fair', label: 'Few late payments recently' },
        { value: 'poor', label: 'Multiple recent late payments' }
      ]
    },
    {
      id: 'utilization',
      label: 'Credit Utilization',
      weight: 30,
      value: 15,
      inputType: 'range',
      min: 0,
      max: 100
    },
    {
      id: 'history',
      label: 'Credit History Length',
      weight: 15,
      value: 5,
      inputType: 'number',
      min: 0,
      max: 50
    },
    {
      id: 'mix',
      label: 'Credit Mix',
      weight: 10,
      value: 'good',
      inputType: 'select',
      options: [
        { value: 'excellent', label: 'Multiple types (cards, loans, mortgage)' },
        { value: 'good', label: 'Credit cards and one loan type' },
        { value: 'fair', label: 'Only credit cards' },
        { value: 'poor', label: 'Very limited credit types' }
      ]
    },
    {
      id: 'inquiries',
      label: 'New Credit Inquiries',
      weight: 10,
      value: 1,
      inputType: 'number',
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
          else factorScore = 0.3;
          break;

        case 'inquiries':
          const inquiriesValue = factor.value as number;
          if (inquiriesValue === 0) factorScore = 1.0;
          else if (inquiriesValue <= 2) factorScore = 0.8;
          else if (inquiriesValue <= 4) factorScore = 0.6;
          else if (inquiriesValue <= 6) factorScore = 0.4;
          else factorScore = 0.2;
          break;
      }

      totalScore += factorScore * weightedContribution;
    });

    const finalScore = minScore + totalScore;
    return Math.round(Math.min(Math.max(finalScore, minScore), maxScore));
  };

  const updateFactor = (id: string, field: string, value: any) => {
    setFactors(factors.map(factor => 
      factor.id === id ? { ...factor, [field]: value } : factor
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

  const getImprovementPotential = (): Improvement[] => {
    const improvements: Improvement[] = [];
    
    factors.forEach(factor => {
      switch (factor.id) {
        case 'payment':
          if (factor.value !== 'excellent') {
            improvements.push({
              factor: 'Payment History',
              impact: 'High',
              suggestion: 'Set up automatic payments to ensure you never miss a due date'
            });
          }
          break;
        case 'utilization':
          const util = factor.value as number;
          if (util > 10) {
            improvements.push({
              factor: 'Credit Utilization',
              impact: util > 30 ? 'High' : 'Medium',
              suggestion: `Pay down balances to get below ${util > 30 ? '30%' : '10%'} utilization`
            });
          }
          break;
        case 'history':
          const hist = factor.value as number;
          if (hist < 7) {
            improvements.push({
              factor: 'Credit History',
              impact: 'Medium',
              suggestion: 'Keep old accounts open and avoid closing your oldest credit cards'
            });
          }
          break;
        case 'mix':
          if (factor.value === 'poor' || factor.value === 'fair') {
            improvements.push({
              factor: 'Credit Mix',
              impact: 'Low',
              suggestion: 'Consider diversifying your credit types (cards, loans, etc.)'
            });
          }
          break;
        case 'inquiries':
          const inq = factor.value as number;
          if (inq > 2) {
            improvements.push({
              factor: 'New Credit',
              impact: 'Medium',
              suggestion: 'Avoid applying for new credit for the next 6-12 months'
            });
          }
          break;
      }
    });

    return improvements;
  };

  const improvements = getImprovementPotential();

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Current Score Input Section */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 relative">
            {/* Info Button */}
            <div className="absolute top-6 right-6">
              <InfoButton onClick={() => setIsInfoModalOpen(true)} />
            </div>

            <div className="mb-6 pr-12">
              <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <img 
                  src={ChartIcon} 
                  alt="Chart"
                  className="w-8 h-8"
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
              </div>
              <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
                Current Credit Profile
              </h2>
              <p className="text-gray-600 text-center text-sm">
                Enter your current credit information
              </p>
            </div>

            <div className="space-y-4">
              {factors.map((factor) => (
                <div key={factor.id}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {factor.label} ({factor.weight}%)
                  </label>
                  {factor.inputType === 'select' ? (
                    <select
                      value={factor.value}
                      onChange={(e) => updateFactor(factor.id, 'value', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      {factor.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : factor.inputType === 'range' ? (
                    <div>
                      <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>{factor.min}%</span>
                        <span className="font-medium text-gray-700">{factor.value}%</span>
                        <span>{factor.max}%</span>
                      </div>
                      <input
                        type="range"
                        min={factor.min}
                        max={factor.max}
                        value={factor.value}
                        onChange={(e) => updateFactor(factor.id, 'value', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      />
                      <p className="text-xs text-gray-500 mt-1">Percentage of available credit you're using</p>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="number"
                        min={factor.min}
                        max={factor.max}
                        value={factor.value}
                        onChange={(e) => updateFactor(factor.id, 'value', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder={factor.id === 'history' ? '5' : '1'}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {factor.id === 'history' ? 'Years of credit history' : 'Hard inquiries in past 2 years'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Improvement Suggestions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Improvement Opportunities</h3>
            {improvements.length > 0 ? (
              <div className="space-y-3">
                {improvements.map((improvement, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <span className={`flex-shrink-0 w-6 h-6 rounded-full text-white text-xs font-medium flex items-center justify-center ${
                        improvement.impact === 'High' ? 'bg-red-500' :
                        improvement.impact === 'Medium' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900">{improvement.factor}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            improvement.impact === 'High' ? 'bg-red-100 text-red-700' :
                            improvement.impact === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {improvement.impact} Impact
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{improvement.suggestion}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🎉</div>
                <h4 className="text-lg font-semibold text-green-600 mb-2">Excellent Credit Profile!</h4>
                <p className="text-gray-600">Your credit factors are already optimized. Keep up the great work!</p>
              </div>
            )}
          </div>

          {/* General Tips */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <h4 className="text-lg font-semibold text-green-900 mb-3">💡 General Credit Tips</h4>
            <div className="grid grid-cols-1 gap-3 text-sm text-green-800">
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Check your credit report regularly for errors</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Keep credit card balances low</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Don't close old credit accounts</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <span>Limit new credit applications</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Estimated Score Display */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-4">Estimated Credit Score</h3>
              <div className="text-center mb-4">
                <div className="text-sm text-gray-500 mb-2">Based on your credit profile</div>
              </div>
            </div>

            <div className={`rounded-xl p-6 border-2 ${currentCategory.color} text-center mb-6`}>
              <div className="text-5xl font-bold mb-2">{estimatedScore}</div>
              <div className="text-lg font-semibold mb-1">{currentCategory.level}</div>
              <div className="text-sm opacity-75">{currentCategory.range}</div>
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
                  <span>300</span>
                  <span>580</span>
                  <span>670</span>
                  <span>740</span>
                  <span>800</span>
                  <span>850</span>
                </div>
              </div>
            </div>

            {/* Factor Breakdown */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900">Credit Score Factors</h4>
              {factors.map((factor) => (
                <div key={factor.id} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">{factor.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{factor.weight}%</span>
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

          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Improvement Timeline</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold text-xs">1M</span>
                </div>
                <span>Lower credit utilization shows improvement</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold text-xs">3M</span>
                </div>
                <span>Consistent payment history starts building</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold text-xs">6M</span>
                </div>
                <span>Significant score improvements visible</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-semibold text-xs">12M</span>
                </div>
                <span>Credit age benefits and full optimization</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title={calculatorInfoData["credit-score"].title}
        description={calculatorInfoData["credit-score"].description}
        howToUse={calculatorInfoData["credit-score"].howToUse}
        terms={calculatorInfoData["credit-score"].terms}
      />
    </div>
  );
};

export default CreditScoreCalculator;