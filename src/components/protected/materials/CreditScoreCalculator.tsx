import React, { useState, useEffect } from 'react';

interface CreditFactor {
  id: string;
  label: string;
  weight: number;
  currentValue: string;
  targetValue: string;
  inputType: 'select' | 'number';
  options?: Array<{ value: string; label: string; score: number }>;
  min?: number;
  max?: number;
  unit?: string;
}

const CreditScoreCalculator: React.FC = () => {
  const [factors, setFactors] = useState<CreditFactor[]>([
    {
      id: 'payment-history',
      label: 'Payment History',
      weight: 35,
      currentValue: 'excellent',
      targetValue: 'excellent',
      inputType: 'select',
      options: [
        { value: 'poor', label: 'Poor (Multiple late payments)', score: 300 },
        { value: 'fair', label: 'Fair (Few late payments)', score: 580 },
        { value: 'good', label: 'Good (Rarely late)', score: 670 },
        { value: 'excellent', label: 'Excellent (Always on time)', score: 750 }
      ]
    },
    {
      id: 'credit-utilization',
      label: 'Credit Utilization',
      weight: 30,
      currentValue: '30',
      targetValue: '10',
      inputType: 'number',
      min: 0,
      max: 100,
      unit: '%'
    },
    {
      id: 'credit-age',
      label: 'Average Credit Age',
      weight: 15,
      currentValue: '5',
      targetValue: '10',
      inputType: 'number',
      min: 0,
      max: 50,
      unit: 'years'
    },
    {
      id: 'credit-mix',
      label: 'Credit Mix',
      weight: 10,
      currentValue: 'good',
      targetValue: 'excellent',
      inputType: 'select',
      options: [
        { value: 'poor', label: 'Poor (One type only)', score: 580 },
        { value: 'fair', label: 'Fair (Two types)', score: 650 },
        { value: 'good', label: 'Good (Three types)', score: 700 },
        { value: 'excellent', label: 'Excellent (Multiple types)', score: 750 }
      ]
    },
    {
      id: 'new-credit',
      label: 'New Credit Inquiries',
      weight: 10,
      currentValue: '2',
      targetValue: '0',
      inputType: 'number',
      min: 0,
      max: 10,
      unit: 'inquiries'
    }
  ]);

  const [currentScore, setCurrentScore] = useState<number>(0);
  const [targetScore, setTargetScore] = useState<number>(0);

  const calculateScore = (factorValues: { [key: string]: string }, useTarget: boolean = false): number => {
    let totalScore = 0;

    factors.forEach(factor => {
      const value = useTarget ? factorValues[`${factor.id}-target`] || factor.targetValue : factorValues[factor.id] || factor.currentValue;
      let factorScore = 0;

      if (factor.inputType === 'select') {
        const option = factor.options?.find(opt => opt.value === value);
        factorScore = option ? option.score : 650;
      } else {
        const numValue = parseFloat(value);
        
        switch (factor.id) {
          case 'credit-utilization':
            if (numValue <= 10) factorScore = 750;
            else if (numValue <= 30) factorScore = 700;
            else if (numValue <= 50) factorScore = 650;
            else if (numValue <= 70) factorScore = 600;
            else factorScore = 550;
            break;
          case 'credit-age':
            if (numValue >= 10) factorScore = 750;
            else if (numValue >= 5) factorScore = 700;
            else if (numValue >= 2) factorScore = 650;
            else factorScore = 600;
            break;
          case 'new-credit':
            if (numValue === 0) factorScore = 750;
            else if (numValue <= 2) factorScore = 700;
            else if (numValue <= 4) factorScore = 650;
            else factorScore = 600;
            break;
          default:
            factorScore = 650;
        }
      }

      totalScore += (factorScore * factor.weight) / 100;
    });

    return Math.round(totalScore);
  };

  useEffect(() => {
    const currentValues: { [key: string]: string } = {};
    const targetValues: { [key: string]: string } = {};
    
    factors.forEach(factor => {
      currentValues[factor.id] = factor.currentValue;
      targetValues[`${factor.id}-target`] = factor.targetValue;
    });

    setCurrentScore(calculateScore(currentValues, false));
    setTargetScore(calculateScore(targetValues, true));
  }, [factors]);

  const updateFactor = (id: string, field: 'currentValue' | 'targetValue', value: string) => {
    setFactors(prev => prev.map(factor => 
      factor.id === id ? { ...factor, [field]: value } : factor
    ));
  };

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

  const currentCategory = getScoreCategory(currentScore);
  const targetCategory = getScoreCategory(targetScore);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Score Input Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 h-fit">
          <div className="mb-6">
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
                    value={factor.currentValue}
                    onChange={(e) => updateFactor(factor.id, 'currentValue', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                  >
                    {factor.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      min={factor.min}
                      max={factor.max}
                      value={factor.currentValue}
                      onChange={(e) => updateFactor(factor.id, 'currentValue', e.target.value)}
                      className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    {factor.unit && (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        {factor.unit}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Target Score Input Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 h-fit">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🎯</span>
            </div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Target Credit Profile
            </h2>
            <p className="text-gray-600 text-center text-sm">
              Set your improvement goals
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
                    value={factor.targetValue}
                    onChange={(e) => updateFactor(factor.id, 'targetValue', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {factor.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="relative">
                    <input
                      type="number"
                      min={factor.min}
                      max={factor.max}
                      value={factor.targetValue}
                      onChange={(e) => updateFactor(factor.id, 'targetValue', e.target.value)}
                      className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {factor.unit && (
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        {factor.unit}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Current Score */}
          <div className={`rounded-2xl p-6 border-2 ${currentCategory.color}`}>
            <h3 className="text-lg font-semibold mb-2">Current Credit Score</h3>
            <div className="text-4xl font-bold mb-2">
              {currentScore}
            </div>
            <div className="text-lg font-semibold mb-1">
              {currentCategory.level}
            </div>
            <p className="text-sm">
              Range: {currentCategory.range}
            </p>
          </div>

          {/* Target Score */}
          <div className={`rounded-2xl p-6 border-2 ${targetCategory.color}`}>
            <h3 className="text-lg font-semibold mb-2">Target Credit Score</h3>
            <div className="text-4xl font-bold mb-2">
              {targetScore}
            </div>
            <div className="text-lg font-semibold mb-1">
              {targetCategory.level}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span>Improvement: </span>
              <span className={`font-semibold ${targetScore > currentScore ? 'text-green-600' : targetScore < currentScore ? 'text-red-600' : 'text-gray-600'}`}>
                {targetScore > currentScore ? '+' : ''}{targetScore - currentScore} points
              </span>
            </div>
          </div>

          {/* Factor Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
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
        {/* Improvement Tips - Spans first two columns */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 -mt-24">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Improvement Tips</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <div>
                <span className="font-medium">Payment History (35%)</span>
                <p>Make all payments on time. Set up automatic payments to never miss a due date.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <div>
                <span className="font-medium">Credit Utilization (30%)</span>
                <p>Keep credit card balances below 30% of limits, ideally under 10%.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <div>
                <span className="font-medium">Credit Age (15%)</span>
                <p>Keep old accounts open and avoid opening too many new accounts.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <div>
                <span className="font-medium">Credit Mix (10%)</span>
                <p>Maintain a healthy mix of credit cards, loans, and other credit types.</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 mt-1">✓</span>
              <div>
                <span className="font-medium">New Credit (10%)</span>
                <p>Limit hard inquiries and space out credit applications.</p>
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
    </div>
  );
};

export default CreditScoreCalculator;