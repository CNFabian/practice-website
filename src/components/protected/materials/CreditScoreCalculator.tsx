import React, { useState } from 'react';
import InfoButton from './InfoButton';
import InfoModal from './InfoModal';
import { calculatorInfoData } from './InfoData';

interface Improvement {
  factor: string;
  impact: 'High' | 'Medium' | 'Low';
  suggestion: string;
}

const CreditScoreCalculator: React.FC = () => {
  // Credit factor inputs
  const [factors, setFactors] = useState([
    { id: 'payment', label: 'Payment History', weight: 35, value: 'good', inputType: 'select' as const },
    { id: 'utilization', label: 'Credit Utilization', weight: 30, value: 30, inputType: 'number' as const },
    { id: 'history', label: 'Credit History Length', weight: 15, value: 5, inputType: 'number' as const },
    { id: 'mix', label: 'Credit Mix', weight: 10, value: 'fair', inputType: 'select' as const },
    { id: 'inquiries', label: 'New Credit Inquiries', weight: 10, value: 2, inputType: 'number' as const }
  ]);

  // New state for info modal
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  // Credit score calculation function
  const calculateCreditScore = (): number => {
    let baseScore = 300; // Starting point
    let totalPoints = 0;

    factors.forEach(factor => {
      let factorScore = 0;
      const maxPoints = factor.weight * 15; // Max points per factor (roughly 850-300 = 550 distributed by weight)

      switch (factor.id) {
        case 'payment':
          const paymentValue = factor.value as string;
          if (paymentValue === 'excellent') factorScore = maxPoints;
          else if (paymentValue === 'good') factorScore = maxPoints * 0.8;
          else if (paymentValue === 'fair') factorScore = maxPoints * 0.5;
          else factorScore = maxPoints * 0.2;
          break;

        case 'utilization':
          const utilizationValue = factor.value as number;
          if (utilizationValue <= 10) factorScore = maxPoints;
          else if (utilizationValue <= 30) factorScore = maxPoints * 0.8;
          else if (utilizationValue <= 50) factorScore = maxPoints * 0.5;
          else if (utilizationValue <= 75) factorScore = maxPoints * 0.3;
          else factorScore = maxPoints * 0.1;
          break;

        case 'history':
          const historyValue = factor.value as number;
          if (historyValue >= 10) factorScore = maxPoints;
          else if (historyValue >= 7) factorScore = maxPoints * 0.9;
          else if (historyValue >= 5) factorScore = maxPoints * 0.8;
          else if (historyValue >= 3) factorScore = maxPoints * 0.6;
          else if (historyValue >= 1) factorScore = maxPoints * 0.4;
          else factorScore = maxPoints * 0.2;
          break;

        case 'mix':
          const mixValue = factor.value as string;
          if (mixValue === 'excellent') factorScore = maxPoints;
          else if (mixValue === 'good') factorScore = maxPoints * 0.8;
          else if (mixValue === 'fair') factorScore = maxPoints * 0.6;
          else factorScore = maxPoints * 0.3;
          break;

        case 'inquiries':
          const inquiriesValue = factor.value as number;
          if (inquiriesValue === 0) factorScore = maxPoints;
          else if (inquiriesValue <= 2) factorScore = maxPoints * 0.8;
          else if (inquiriesValue <= 4) factorScore = maxPoints * 0.6;
          else if (inquiriesValue <= 6) factorScore = maxPoints * 0.4;
          else factorScore = maxPoints * 0.2;
          break;
      }

      totalPoints += factorScore;
    });

    return Math.round(baseScore + totalPoints);
  };

  const updateFactor = (id: string, field: string, value: any) => {
    setFactors(factors.map(factor => 
      factor.id === id ? { ...factor, [field]: value } : factor
    ));
  };

  // Calculate current estimated score
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

  // Calculate improvement suggestions
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
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Score Input Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 h-fit relative">
          {/* Info Button - positioned in top right */}
          <div className="absolute top-6 right-6">
            <InfoButton onClick={() => setIsInfoModalOpen(true)} />
          </div>

          <div className="mb-6 pr-12">
            <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">📈</span>
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
                    value={factor.value as string}
                    onChange={(e) => updateFactor(factor.id, 'value', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {factor.id === 'payment' && (
                      <>
                        <option value="excellent">Always on time</option>
                        <option value="good">Mostly on time</option>
                        <option value="fair">Sometimes late</option>
                        <option value="poor">Often late</option>
                      </>
                    )}
                    {factor.id === 'mix' && (
                      <>
                        <option value="excellent">Credit cards, loans, mortgage</option>
                        <option value="good">Credit cards and one loan type</option>
                        <option value="fair">Only credit cards</option>
                        <option value="poor">Limited credit types</option>
                      </>
                    )}
                  </select>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      value={factor.value as number}
                      onChange={(e) => updateFactor(factor.id, 'value', parseFloat(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder={factor.id === 'utilization' ? '30' : factor.id === 'history' ? '5' : '2'}
                    />
                    {factor.id === 'utilization' && (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                    )}
                    {factor.id === 'history' && (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">years</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Estimated Score Display */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 h-fit">
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
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>300</span>
                <span>Poor</span>
                <span>Fair</span>
                <span>Good</span>
                <span>Very Good</span>
                <span>Exceptional</span>
                <span>850</span>
              </div>
            </div>
          </div>

          {/* Top Improvement Opportunity */}
          {improvements.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h4 className="font-semibold text-blue-900 mb-2">🎯 Top Improvement</h4>
              <div className="text-sm text-blue-800">
                <div className="font-medium">{improvements[0].factor}</div>
                <div className="text-blue-600 mt-1">{improvements[0].suggestion}</div>
              </div>
            </div>
          )}

          {/* Factor Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Credit Factor Impact</h3>
            <div className="space-y-3">
              {factors.map((factor) => (
                <div key={factor.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{factor.label}</span>
                    <span className="text-sm font-medium">{factor.weight}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${factor.weight}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Improvement Opportunities - Spans first two columns */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personalized Improvement Plan</h3>
          
          {improvements.length > 0 ? (
            <div className="space-y-4">
              {improvements.map((improvement, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  improvement.impact === 'High' ? 'bg-red-50 border-red-200' :
                  improvement.impact === 'Medium' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
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

          {/* General Tips */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold text-gray-900 mb-3">General Credit Tips</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Check your credit report regularly for errors</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Keep credit card balances low</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Don't close old credit accounts</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Limit new credit applications</span>
              </div>
            </div>
          </div>
        </div>

        {/* Timeline - Third column */}
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