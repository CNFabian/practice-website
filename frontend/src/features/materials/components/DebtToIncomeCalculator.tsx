import React, { useState } from 'react';
import InfoButton from './InfoButton';
import InfoModal from './InfoModal';
import { calculatorInfoData } from './InfoData';
import { ScalesIcon, OnestFont } from '../../../assets';
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
        color: 'text-status-green bg-status-green/10 border-status-green',
        description: 'You have excellent debt management and strong borrowing power.'
      };
    } else if (ratio <= 36) {
      return {
        level: 'Good',
        color: 'text-logo-blue bg-logo-blue/10 border-logo-blue',
        description: 'You have good debt management and should qualify for most loans.'
      };
    } else if (ratio <= 43) {
      return {
        level: 'Fair',
        color: 'text-status-yellow bg-status-yellow/10 border-status-yellow',
        description: 'Your DTI is manageable but may limit some loan options.'
      };
    } else {
      return {
        level: 'High',
        color: 'text-status-red bg-status-red/10 border-status-red',
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
        <div className="bg-pure-white rounded-2xl border border-light-background-blue p-6 h-fit relative">
          {/* Info Button - positioned in top right */}
          <div className="absolute top-6 right-6">
            <InfoButton onClick={() => setIsInfoModalOpen(true)} />
          </div>

          <div className="mb-6 pr-12">
            <div className="w-16 h-16 bg-logo-blue rounded-2xl flex items-center justify-center mx-auto mb-4">
              <img 
                src={ScalesIcon} 
                alt="Scales"
                className="w-8 h-8"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <OnestFont as="h2" weight={700} lineHeight="tight" className="text-xl text-text-blue-black text-center mb-2">
              Debt-to-Income Calculator
            </OnestFont>
            <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-center text-sm">
              Calculate your debt-to-income ratio for loan qualification
            </OnestFont>
          </div>

          <div className="space-y-4">
            {/* Monthly Income */}
            <div>
              <OnestFont as="label" weight={500} lineHeight="relaxed" className="block text-sm text-text-blue-black mb-2">
                Gross Monthly Income
              </OnestFont>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-grey">$</span>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(validateCurrencyInput(e.target.value, 1000000))}
                  className="w-full pl-8 pr-4 py-3 border border-light-background-blue rounded-lg focus:ring-2 focus:ring-logo-blue focus:border-transparent"
                  placeholder="5000"
                />
              </div>
              <OnestFont weight={300} lineHeight="relaxed" className="text-xs text-text-grey mt-1">
                Income before taxes and deductions
              </OnestFont>
            </div>

            {/* Housing Payment */}
            <div>
              <OnestFont as="label" weight={500} lineHeight="relaxed" className="block text-sm text-text-blue-black mb-2">
                Monthly Housing Payment
              </OnestFont>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-grey">$</span>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  value={housingPayment}
                  onChange={(e) => setHousingPayment(validateCurrencyInput(e.target.value, 100000))}
                  className="w-full pl-8 pr-4 py-3 border border-light-background-blue rounded-lg focus:ring-2 focus:ring-logo-blue focus:border-transparent"
                  placeholder="1200"
                />
              </div>
              <OnestFont weight={300} lineHeight="relaxed" className="text-xs text-text-grey mt-1">
                Rent or mortgage payment including taxes and insurance
              </OnestFont>
            </div>

            {/* Other Debts */}
            <div className="border-t pt-4">
              <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-lg text-text-blue-black mb-3">
                Other Monthly Debt Payments
              </OnestFont>
              
              {/* Credit Card Payments */}
              <div className="mb-3">
                <OnestFont as="label" weight={500} lineHeight="relaxed" className="block text-sm text-text-blue-black mb-2">
                  Credit Card Minimum Payments
                </OnestFont>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-grey">$</span>
                  <input
                    type="number"
                    min="0"
                    max="50000"
                    value={creditCardPayments}
                    onChange={(e) => setCreditCardPayments(validateCurrencyInput(e.target.value, 50000))}
                    className="w-full pl-8 pr-4 py-3 border border-light-background-blue rounded-lg focus:ring-2 focus:ring-logo-blue focus:border-transparent"
                    placeholder="150"
                  />
                </div>
              </div>

              {/* Car Payments */}
              <div className="mb-3">
                <OnestFont as="label" weight={500} lineHeight="relaxed" className="block text-sm text-text-blue-black mb-2">
                  Auto Loan Payments
                </OnestFont>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-grey">$</span>
                  <input
                    type="number"
                    min="0"
                    max="50000"
                    value={carPayments}
                    onChange={(e) => setCarPayments(validateCurrencyInput(e.target.value, 50000))}
                    className="w-full pl-8 pr-4 py-3 border border-light-background-blue rounded-lg focus:ring-2 focus:ring-logo-blue focus:border-transparent"
                    placeholder="300"
                  />
                </div>
              </div>

              {/* Student Loans */}
              <div className="mb-3">
                <OnestFont as="label" weight={500} lineHeight="relaxed" className="block text-sm text-text-blue-black mb-2">
                  Student Loan Payments
                </OnestFont>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-grey">$</span>
                  <input
                    type="number"
                    min="0"
                    max="50000"
                    value={studentLoans}
                    onChange={(e) => setStudentLoans(validateCurrencyInput(e.target.value, 50000))}
                    className="w-full pl-8 pr-4 py-3 border border-light-background-blue rounded-lg focus:ring-2 focus:ring-logo-blue focus:border-transparent"
                    placeholder="250"
                  />
                </div>
              </div>

              {/* Other Debts */}
              <div>
                <OnestFont as="label" weight={500} lineHeight="relaxed" className="block text-sm text-text-blue-black mb-2">
                  Other Debt Payments
                </OnestFont>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-grey">$</span>
                  <input
                    type="number"
                    min="0"
                    max="50000"
                    value={otherDebts}
                    onChange={(e) => setOtherDebts(validateCurrencyInput(e.target.value, 50000))}
                    className="w-full pl-8 pr-4 py-3 border border-light-background-blue rounded-lg focus:ring-2 focus:ring-logo-blue focus:border-transparent"
                    placeholder="100"
                  />
                </div>
                <OnestFont weight={300} lineHeight="relaxed" className="text-xs text-text-grey mt-1">
                  Personal loans, alimony, child support, etc.
                </OnestFont>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* DTI Ratio Display */}
          <div className="bg-pure-white rounded-2xl border border-light-background-blue p-6">
            <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-lg text-text-blue-black mb-4">
              Your Debt-to-Income Ratio
            </OnestFont>
            
            <div className="text-center mb-6">
              <OnestFont weight={700} lineHeight="tight" className="text-4xl text-logo-blue mb-2">
                {dtiRatio.toFixed(1)}%
              </OnestFont>
              <OnestFont weight={500} lineHeight="relaxed" className={`inline-block px-4 py-2 rounded-full border-2 ${category.color}`}>
                {category.level}
              </OnestFont>
            </div>

            <OnestFont weight={300} lineHeight="relaxed" className="text-center text-text-grey text-sm mb-6">
              {category.description}
            </OnestFont>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-text-grey mb-2">
                <OnestFont weight={300} lineHeight="relaxed">0%</OnestFont>
                <OnestFont weight={300} lineHeight="relaxed">20%</OnestFont>
                <OnestFont weight={300} lineHeight="relaxed">36%</OnestFont>
                <OnestFont weight={300} lineHeight="relaxed">43%</OnestFont>
                <OnestFont weight={300} lineHeight="relaxed">50%+</OnestFont>
              </div>
              <div className="w-full bg-light-background-blue rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    dtiRatio <= 20 ? 'bg-status-green' :
                    dtiRatio <= 36 ? 'bg-logo-blue' :
                    dtiRatio <= 43 ? 'bg-status-yellow' : 'bg-status-red'
                  }`}
                  style={{ width: `${Math.min(dtiRatio, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Debt Breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey">Monthly Income:</OnestFont>
                <OnestFont weight={500} lineHeight="relaxed">${parseFloat(monthlyIncome) || 0}</OnestFont>
              </div>
              <div className="flex justify-between">
                <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey">Total Monthly Debt:</OnestFont>
                <OnestFont weight={500} lineHeight="relaxed">${totalDebts}</OnestFont>
              </div>
            </div>
          </div>

          {/* DTI Guidelines */}
          <div className="bg-pure-white rounded-2xl border border-light-background-blue p-6">
            <OnestFont as="h3" weight={700} lineHeight="relaxed" className="text-lg text-text-blue-black mb-4">
              Lender Guidelines
            </OnestFont>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-3 bg-status-green/10 rounded-lg">
                <OnestFont weight={500} lineHeight="relaxed" className="text-status-green">Excellent (≤20%)</OnestFont>
                <OnestFont weight={300} lineHeight="relaxed" className="text-status-green">Best loan terms available</OnestFont>
              </div>
              <div className="flex justify-between items-center p-3 bg-logo-blue/10 rounded-lg">
                <OnestFont weight={500} lineHeight="relaxed" className="text-logo-blue">Good (21-36%)</OnestFont>
                <OnestFont weight={300} lineHeight="relaxed" className="text-logo-blue">Most loans approved</OnestFont>
              </div>
              <div className="flex justify-between items-center p-3 bg-status-yellow/10 rounded-lg">
                <OnestFont weight={500} lineHeight="relaxed" className="text-status-yellow">Fair (37-43%)</OnestFont>
                <OnestFont weight={300} lineHeight="relaxed" className="text-status-yellow">Some restrictions apply</OnestFont>
              </div>
              <div className="flex justify-between items-center p-3 bg-status-red/10 rounded-lg">
                <OnestFont weight={500} lineHeight="relaxed" className="text-status-red">High (43%)</OnestFont>
                <OnestFont weight={300} lineHeight="relaxed" className="text-status-red">Difficult to qualify</OnestFont>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-logo-blue/10 border border-logo-blue rounded-2xl p-6">
            <OnestFont as="h3" weight={500} lineHeight="relaxed" className="text-lg text-logo-blue mb-3">
              💡 Improvement Tips
            </OnestFont>
            <ul className="space-y-2 text-sm">
              <li>
                <OnestFont weight={500} lineHeight="relaxed" className="text-logo-blue">
                  • Pay down high-interest debt first
                </OnestFont>
              </li>
              <li>
                <OnestFont weight={500} lineHeight="relaxed" className="text-logo-blue">
                  • Increase your income through side work
                </OnestFont>
              </li>
              <li>
                <OnestFont weight={500} lineHeight="relaxed" className="text-logo-blue">
                  • Avoid taking on new debt
                </OnestFont>
              </li>
              <li>
                <OnestFont weight={500} lineHeight="relaxed" className="text-logo-blue">
                  • Consider debt consolidation options
                </OnestFont>
              </li>
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