import React, { useState } from 'react';
import RobotoFont from '../../../assets/fonts';
import { MaterialHomeIcon } from '../../../assets';
import InfoButton from './InfoButton';
import InfoModal from './InfoModal';
import { calculatorInfoData } from './InfoData';

const MortgageCalculator: React.FC = () => {
  const [homePrice, setHomePrice] = useState<number>(500000);
  const [downPayment, setDownPayment] = useState<number>(100000);
  const [loanTerm, setLoanTerm] = useState<number>(30);
  const [interestRate, setInterestRate] = useState<number>(6.5);
  const [propertyTax, setPropertyTax] = useState<number>(500);
  const [homeInsurance, setHomeInsurance] = useState<number>(150);
  const [pmi, setPmi] = useState<number>(0);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const validateCurrencyInput = (value: string, max: number): number => {
    const numValue = parseFloat(value) || 0;
    return Math.min(Math.max(numValue, 0), max);
  };

  const validatePercentageInput = (value: string, max: number): number => {
    const numValue = parseFloat(value) || 0;
    return Math.min(Math.max(numValue, 0), max);
  };

  const calculateMortgage = () => {
    const principal = homePrice - downPayment;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;
    
    if (monthlyRate === 0) {
      const monthlyPayment = principal / numberOfPayments;
      return {
        monthlyPayment: monthlyPayment + propertyTax + homeInsurance + pmi,
        principalAndInterest: monthlyPayment,
        totalPayment: (monthlyPayment * numberOfPayments) + (propertyTax + homeInsurance + pmi) * numberOfPayments,
        totalInterest: 0,
        principalAmount: principal
      };
    }
    
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
                          (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    
    return {
      monthlyPayment: monthlyPayment + propertyTax + homeInsurance + pmi,
      principalAndInterest: monthlyPayment,
      totalPayment: (monthlyPayment * numberOfPayments) + (propertyTax + homeInsurance + pmi) * numberOfPayments,
      totalInterest: (monthlyPayment * numberOfPayments) - principal,
      principalAmount: principal
    };
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const results = calculateMortgage();
  const { principalAndInterest, totalPayment, totalInterest, principalAmount } = results;

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
                src={MaterialHomeIcon} 
                alt="Home"
                className="w-8 h-8"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <RobotoFont as="h2" weight={700} className="text-xl text-gray-900 text-center mb-2">
              Mortgage Calculator
            </RobotoFont>
            <RobotoFont className="text-gray-600 text-center text-sm">
              Calculate your estimated monthly mortgage payments
            </RobotoFont>
          </div>

          <div className="space-y-4">
            {/* Home Price */}
            <div>
              <RobotoFont as="label" weight={500} className="block text-sm text-gray-700 mb-2">
                Home Price
              </RobotoFont>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  max="50000000"
                  value={homePrice}
                  onChange={(e) => setHomePrice(validateCurrencyInput(e.target.value, 50000000))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="500000"
                />
              </div>
            </div>

            {/* Down Payment */}
            <div>
              <RobotoFont as="label" weight={500} className="block text-sm text-gray-700 mb-2">
                Down Payment
              </RobotoFont>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  max={homePrice}
                  value={downPayment}
                  onChange={(e) => setDownPayment(validateCurrencyInput(e.target.value, homePrice))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100000"
                />
              </div>
              <RobotoFont className="text-xs text-gray-500 mt-1">
                {((downPayment / homePrice) * 100).toFixed(1)}% of home price
              </RobotoFont>
            </div>

            {/* Loan Term */}
            <div>
              <RobotoFont as="label" weight={500} className="block text-sm text-gray-700 mb-2">
                Loan Term (Years)
              </RobotoFont>
              <select
                value={loanTerm}
                onChange={(e) => setLoanTerm(parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={15}>15 years</option>
                <option value={20}>20 years</option>
                <option value={25}>25 years</option>
                <option value={30}>30 years</option>
              </select>
            </div>

            {/* Interest Rate */}
            <div>
              <RobotoFont as="label" weight={500} className="block text-sm text-gray-700 mb-2">
                Interest Rate
              </RobotoFont>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(validatePercentageInput(e.target.value, 30))}
                  className="w-full pr-8 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="6.5"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>

            {/* Property Tax */}
            <div>
              <RobotoFont as="label" weight={500} className="block text-sm text-gray-700 mb-2">
                Monthly Property Tax
              </RobotoFont>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={propertyTax}
                  onChange={(e) => setPropertyTax(validateCurrencyInput(e.target.value, 10000))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="500"
                />
              </div>
            </div>

            {/* Home Insurance */}
            <div>
              <RobotoFont as="label" weight={500} className="block text-sm text-gray-700 mb-2">
                Monthly Home Insurance
              </RobotoFont>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  max="2000"
                  value={homeInsurance}
                  onChange={(e) => setHomeInsurance(validateCurrencyInput(e.target.value, 2000))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="150"
                />
              </div>
            </div>

            {/* PMI */}
            <div>
              <RobotoFont as="label" weight={500} className="block text-sm text-gray-700 mb-2">
                Monthly PMI
              </RobotoFont>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={pmi}
                  onChange={(e) => setPmi(validateCurrencyInput(e.target.value, 1000))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
              <RobotoFont className="text-xs text-gray-500 mt-1">
                Required if down payment is less than 20%
              </RobotoFont>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Monthly Payment Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <RobotoFont as="h3" weight={600} className="text-lg text-gray-900 mb-4">
              Monthly Payment Breakdown
            </RobotoFont>
            
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex justify-between items-center">
                  <RobotoFont className="text-gray-600">
                    Principal & Interest
                  </RobotoFont>
                  <RobotoFont weight={600} className="text-gray-900">
                    {formatCurrency(principalAndInterest)}
                  </RobotoFont>
                </div>

                <div className="flex justify-between items-center">
                  <RobotoFont className="text-gray-600">
                    Property Tax
                  </RobotoFont>
                  <RobotoFont weight={600} className="text-gray-900">
                    {formatCurrency(propertyTax)}
                  </RobotoFont>
                </div>

                <div className="flex justify-between items-center">
                  <RobotoFont className="text-gray-600">
                    Home Insurance
                  </RobotoFont>
                  <RobotoFont weight={600} className="text-gray-900">
                    {formatCurrency(homeInsurance)}
                  </RobotoFont>
                </div>

                {pmi > 0 && (
                  <div className="flex justify-between items-center">
                    <RobotoFont className="text-gray-600">
                      PMI
                    </RobotoFont>
                    <RobotoFont weight={600} className="text-gray-900">
                      {formatCurrency(pmi)}
                    </RobotoFont>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Loan Summary Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <RobotoFont as="h3" weight={600} className="text-lg text-gray-900 mb-4">
              Loan Summary
            </RobotoFont>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <RobotoFont className="text-gray-600">
                  Loan Amount
                </RobotoFont>
                <RobotoFont weight={600} className="text-gray-900">
                  {formatCurrency(principalAmount)}
                </RobotoFont>
              </div>

              <div className="flex justify-between items-center">
                <RobotoFont className="text-gray-600">
                  Total Interest Paid
                </RobotoFont>
                <RobotoFont weight={600} className="text-gray-900">
                  {formatCurrency(totalInterest)}
                </RobotoFont>
              </div>

              <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                <RobotoFont weight={500} className="text-gray-900">
                  Total Amount Paid
                </RobotoFont>
                <RobotoFont weight={700} className="text-xl text-gray-900">
                  {formatCurrency(totalPayment)}
                </RobotoFont>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <RobotoFont as="h3" weight={600} className="text-lg text-blue-900 mb-3">
              💡 Money-Saving Tips
            </RobotoFont>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>
                <RobotoFont>• A larger down payment reduces PMI and monthly payments</RobotoFont>
              </li>
              <li>
                <RobotoFont>• Shorter loan terms mean higher monthly payments but less total interest</RobotoFont>
              </li>
              <li>
                <RobotoFont>• Shop around for the best interest rates from multiple lenders</RobotoFont>
              </li>
              <li>
                <RobotoFont>• Consider making extra principal payments to reduce total interest</RobotoFont>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Info Modal */}
      <InfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title={calculatorInfoData.mortgage.title}
        description={calculatorInfoData.mortgage.description}
        howToUse={calculatorInfoData.mortgage.howToUse}
        howToUseTitle={calculatorInfoData.mortgage.howToUseTitle}
        terms={calculatorInfoData.mortgage.terms}
      />
    </div>
  );
};

export default MortgageCalculator;