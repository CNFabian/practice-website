import React, { useState } from 'react';
import InfoButton from '../info/InfoButton';
import InfoModal from '../info/InfoModal';
import { calculatorInfoData } from '../info/InfoData';
import { ScalesIcon } from '../../../../assets';
import { validateCurrencyInput } from './validationHelpers';

const DebtToIncomeCalculator: React.FC = () => {
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [housingPayment, setHousingPayment] = useState<string>('');
  const [creditCardPayments, setCreditCardPayments] = useState<string>('');
  const [carPayments, setCarPayments] = useState<string>('');
  const [studentLoans, setStudentLoans] = useState<string>('');
  const [otherDebts, setOtherDebts] = useState<string>('');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const calculateDTI = (): number => {
    const income = parseFloat(monthlyIncome) || 0;
    const totalDebts = (parseFloat(housingPayment) || 0) +
                      (parseFloat(creditCardPayments) || 0) +
                      (parseFloat(carPayments) || 0) +
                      (parseFloat(studentLoans) || 0) +
                      (parseFloat(otherDebts) || 0);

    return income > 0 ? (totalDebts / income) * 100 : 0;
  };

  const getDTICategory = (ratio: number): { level: string; color: string; description: string } => {
    if (ratio <= 20) {
      return {
        level: 'Excellent',
        color: 'text-green-600 bg-green-50 border-green-200',
        description: 'You have excellent debt management and strong borrowing power.'
      };
    } else if (ratio <= 36) {
      return {
        level: 'Good',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        description: 'You have good debt management and should qualify for most loans.'
      };
    } else if (ratio <= 43) {
      return {
        level: 'Fair',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        description: 'Your DTI is manageable but may limit some loan options.'
      };
    } else {
      return {
        level: 'High',
        color: 'text-red-600 bg-red-50 border-red-200',
        description: 'Your DTI is high and may make it difficult to qualify for loans.'
      };
    }
  };

  const dtiRatio = calculateDTI();
  const category = getDTICategory(dtiRatio);
  const totalDebts = (parseFloat(housingPayment) || 0) +
                    (parseFloat(creditCardPayments) || 0) +
                    (parseFloat(carPayments) || 0) +
                    (parseFloat(studentLoans) || 0) +
                    (parseFloat(otherDebts) || 0);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 h-fit relative">
          {/* Info Button - positioned in top right */}
          <div className="absolute top-6 right-6">
            <InfoButton onClick={() => setIsInfoModalOpen(true)} />
          </div>

          <div className="mb-6 pr-12">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <img 
                src={ScalesIcon} 
                alt="Scales"
                className="w-8 h-8"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Debt-to-Income Calculator
            </h2>
            <p className="text-gray-600 text-center text-sm">
              Calculate your debt-to-income ratio for loan qualification
            </p>
          </div>

          <div className="space-y-4">
            {/* Monthly Income */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gross Monthly Income
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(validateCurrencyInput(e.target.value, 1000000))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Income before taxes and deductions</p>
            </div>

            {/* Housing Payment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Housing Payment
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  value={housingPayment}
                  onChange={(e) => setHousingPayment(validateCurrencyInput(e.target.value, 100000))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1200"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Rent or mortgage payment including taxes and insurance</p>
            </div>

            {/* Other Debts */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Other Monthly Debt Payments</h3>
              
              {/* Credit Card Payments */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Card Minimum Payments
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    max="50000"
                    value={creditCardPayments}
                    onChange={(e) => setCreditCardPayments(validateCurrencyInput(e.target.value, 50000))}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="150"
                  />
                </div>
              </div>

              {/* Car Payments */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Auto Loan Payments
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    max="50000"
                    value={carPayments}
                    onChange={(e) => setCarPayments(validateCurrencyInput(e.target.value, 50000))}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="300"
                  />
                </div>
              </div>

              {/* Student Loans */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student Loan Payments
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    max="50000"
                    value={studentLoans}
                    onChange={(e) => setStudentLoans(validateCurrencyInput(e.target.value, 50000))}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="250"
                  />
                </div>
              </div>

              {/* Other Debts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Debt Payments
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    max="50000"
                    value={otherDebts}
                    onChange={(e) => setOtherDebts(validateCurrencyInput(e.target.value, 50000))}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="100"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Personal loans, alimony, child support, etc.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* DTI Ratio Display */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Debt-to-Income Ratio</h3>
            
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {dtiRatio.toFixed(1)}%
              </div>
              <div className={`inline-block px-4 py-2 rounded-full border-2 ${category.color} font-medium`}>
                {category.level}
              </div>
            </div>

            <p className="text-center text-gray-600 text-sm mb-6">
              {category.description}
            </p>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>0%</span>
                <span>20%</span>
                <span>36%</span>
                <span>43%</span>
                <span>50%+</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    dtiRatio <= 20 ? 'bg-green-500' :
                    dtiRatio <= 36 ? 'bg-blue-500' :
                    dtiRatio <= 43 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(dtiRatio, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Debt Breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Income:</span>
                <span className="font-semibold">${parseFloat(monthlyIncome) || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Monthly Debt:</span>
                <span className="font-semibold">${totalDebts}</span>
              </div>
            </div>
          </div>

          {/* DTI Guidelines */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lender Guidelines</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-green-800">Excellent (≤20%)</span>
                <span className="text-green-600">Best loan terms available</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-800">Good (21-36%)</span>
                <span className="text-blue-600">Most loans approved</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                <span className="font-medium text-yellow-800">Fair (37-43%)</span>
                <span className="text-yellow-600">Some restrictions apply</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="font-medium text-red-800">High (43%)</span>
                <span className="text-red-600">Difficult to qualify</span>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Improvement Tips</h3>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>• Pay down high-interest debt first</li>
              <li>• Increase your income through side work</li>
              <li>• Avoid taking on new debt</li>
              <li>• Consider debt consolidation options</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title={calculatorInfoData["debt-to-income"].title}
        description={calculatorInfoData["debt-to-income"].description}
        howToUse={calculatorInfoData["debt-to-income"].howToUse}
        terms={calculatorInfoData["debt-to-income"].terms}
      />
    </div>
  );
};

export default DebtToIncomeCalculator;