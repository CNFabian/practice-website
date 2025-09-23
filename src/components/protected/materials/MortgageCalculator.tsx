import React, { useState } from 'react';
import InfoButton from './InfoButton';
import InfoModal from './InfoModal';
import { calculatorInfoData } from './InfoData';
import { MaterialHomeIcon } from '../../../assets';
import { validateCurrencyInput, validateInterestRateInput } from './validationHelpers';

const MortgageCalculator: React.FC = () => {
  const [homePrice, setHomePrice] = useState<string>('');
  const [downPayment, setDownPayment] = useState<string>('');
  const [loanTerm, setLoanTerm] = useState<string>('30');
  const [interestRate, setInterestRate] = useState<string>('');
  const [propertyTax, setPropertyTax] = useState<string>('');
  const [homeInsurance, setHomeInsurance] = useState<string>('');
  const [pmi, setPmi] = useState<string>('');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const calculateMortgage = () => {
    const price = parseFloat(homePrice) || 0;
    const down = parseFloat(downPayment) || 0;
    const term = parseFloat(loanTerm) || 30;
    const rate = parseFloat(interestRate) || 0;
    const tax = parseFloat(propertyTax) || 0;
    const insurance = parseFloat(homeInsurance) || 0;
    const pmiAmount = parseFloat(pmi) || 0;

    const principal = price - down;
    const monthlyRate = rate / 100 / 12;
    const totalPayments = term * 12;

    if (principal <= 0 || rate <= 0) {
      return {
        monthlyPayment: 0,
        principalAndInterest: 0,
        totalPayment: 0,
        totalInterest: 0,
        principalAmount: principal
      };
    }

    const monthlyPI = principal * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
                     (Math.pow(1 + monthlyRate, totalPayments) - 1);

    const monthlyPayment = monthlyPI + tax + insurance + pmiAmount;
    const totalPayment = monthlyPI * totalPayments;
    const totalInterest = totalPayment - principal;

    return {
      monthlyPayment,
      principalAndInterest: monthlyPI,
      totalPayment,
      totalInterest,
      principalAmount: principal
    };
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const results = calculateMortgage();
  const { monthlyPayment, principalAndInterest, totalPayment, totalInterest, principalAmount } = results;

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
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Mortgage Calculator
            </h2>
            <p className="text-gray-600 text-center text-sm">
              Calculate your estimated monthly mortgage payments
            </p>
          </div>

          <div className="space-y-4">
            {/* Home Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Home Price
              </label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Down Payment
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  max="10000000"
                  value={downPayment}
                  onChange={(e) => setDownPayment(validateCurrencyInput(e.target.value, 10000000))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100000"
                />
              </div>
            </div>

            {/* Loan Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Term (Years)
              </label>
              <select
                value={loanTerm}
                onChange={(e) => setLoanTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="15">15 years</option>
                <option value="20">20 years</option>
                <option value="25">25 years</option>
                <option value="30">30 years</option>
              </select>
            </div>

            {/* Interest Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interest Rate (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="50"
                  value={interestRate}
                  onChange={(e) => setInterestRate(validateInterestRateInput(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="6.5"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>

            {/* Additional Costs */}
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Additional Monthly Costs</h3>
              
              {/* Property Tax */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Tax (Monthly)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    max="100000"
                    value={propertyTax}
                    onChange={(e) => setPropertyTax(validateCurrencyInput(e.target.value, 100000))}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="400"
                  />
                </div>
              </div>

              {/* Home Insurance */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Home Insurance (Monthly)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    max="50000"
                    value={homeInsurance}
                    onChange={(e) => setHomeInsurance(validateCurrencyInput(e.target.value, 50000))}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="150"
                  />
                </div>
              </div>

              {/* PMI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PMI (Monthly)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    min="0"
                    max="10000"
                    value={pmi}
                    onChange={(e) => setPmi(validateCurrencyInput(e.target.value, 10000))}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="200"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Required if down payment is less than 20%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Monthly Payment Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Payment</h3>
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {formatCurrency(monthlyPayment)}
              </div>
              <p className="text-gray-600 text-sm">Total monthly payment</p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-800">Principal & Interest</span>
                <span className="text-blue-600 font-semibold">
                  {formatCurrency(principalAndInterest)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">Property Tax</span>
                <span className="text-gray-600 font-semibold">
                  {formatCurrency(parseFloat(propertyTax) || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">Home Insurance</span>
                <span className="text-gray-600 font-semibold">
                  {formatCurrency(parseFloat(homeInsurance) || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">PMI</span>
                <span className="text-gray-600 font-semibold">
                  {formatCurrency(parseFloat(pmi) || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Loan Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Loan Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Loan Amount</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(principalAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Interest Paid</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(totalInterest)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Amount Paid</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(totalPayment)}
                </span>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-orange-900 mb-3">💡 Money-Saving Tips</h3>
            <ul className="space-y-2 text-sm text-orange-800">
              <li>• Put down 20% to avoid PMI payments</li>
              <li>• Consider a 15-year loan to save on interest</li>
              <li>• Shop around for the best interest rates</li>
              <li>• Factor in closing costs (2-5% of home price)</li>
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
        terms={calculatorInfoData.mortgage.terms}
      />
    </div>
  );
};

export default MortgageCalculator;