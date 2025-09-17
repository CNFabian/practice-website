import React, { useState, useEffect } from 'react';

const MortgageCalculator: React.FC = () => {
  const [loanAmount, setLoanAmount] = useState<string>('');
  const [interestRate, setInterestRate] = useState<string>('');
  const [loanTerm, setLoanTerm] = useState<string>('30');
  const [downPayment, setDownPayment] = useState<string>('');
  const [propertyTax, setPropertyTax] = useState<string>('');
  const [homeInsurance, setHomeInsurance] = useState<string>('');
  const [pmi, setPmi] = useState<string>('');

  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [principalAmount, setPrincipalAmount] = useState<number>(0);

  const calculateMortgage = () => {
    const principal = parseFloat(loanAmount) || 0;
    const rate = (parseFloat(interestRate) || 0) / 100 / 12;
    const payments = (parseFloat(loanTerm) || 0) * 12;
    const tax = (parseFloat(propertyTax) || 0) / 12;
    const insurance = parseFloat(homeInsurance) || 0;
    const pmiAmount = parseFloat(pmi) || 0;

    if (principal > 0 && rate > 0 && payments > 0) {
      // Calculate monthly principal and interest payment
      const monthlyPI = principal * (rate * Math.pow(1 + rate, payments)) / (Math.pow(1 + rate, payments) - 1);
      
      // Total monthly payment including taxes, insurance, and PMI
      const totalMonthly = monthlyPI + tax + insurance + pmiAmount;
      
      // Calculate totals
      const totalPaid = monthlyPI * payments;
      const totalInt = totalPaid - principal;

      setMonthlyPayment(totalMonthly);
      setTotalInterest(totalInt);
      setTotalPayment(totalPaid);
      setPrincipalAmount(principal);
    } else {
      setMonthlyPayment(0);
      setTotalInterest(0);
      setTotalPayment(0);
      setPrincipalAmount(0);
    }
  };

  useEffect(() => {
    calculateMortgage();
  }, [loanAmount, interestRate, loanTerm, downPayment, propertyTax, homeInsurance, pmi]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyDecimal = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">🏠</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Mortgage Calculator
            </h2>
            <p className="text-gray-600 text-center text-sm">
              Calculate your estimated monthly mortgage payments
            </p>
          </div>

          <div className="space-y-4">
            {/* Loan Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Home Price / Loan Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="400,000"
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
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="80,000"
                />
              </div>
            </div>

            {/* Interest Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interest Rate
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full pl-4 pr-8 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="6.5"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
              </div>
            </div>

            {/* Loan Term */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loan Term
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
                    value={propertyTax}
                    onChange={(e) => setPropertyTax(e.target.value)}
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
                    value={homeInsurance}
                    onChange={(e) => setHomeInsurance(e.target.value)}
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
                    value={pmi}
                    onChange={(e) => setPmi(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="200"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {/* Monthly Payment Card */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Monthly Payment</h3>
            <div className="text-3xl font-bold mb-2">
              {formatCurrencyDecimal(monthlyPayment)}
            </div>
            <p className="text-blue-100 text-sm">
              Principal, Interest, Taxes, Insurance & PMI
            </p>
          </div>

          {/* Payment Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Principal & Interest</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrencyDecimal(monthlyPayment - (parseFloat(propertyTax) || 0) - (parseFloat(homeInsurance) || 0) - (parseFloat(pmi) || 0))}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Property Tax</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrencyDecimal(parseFloat(propertyTax) || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Home Insurance</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrencyDecimal(parseFloat(homeInsurance) || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">PMI</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrencyDecimal(parseFloat(pmi) || 0)}
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Monthly Payment</span>
                  <span className="font-bold text-blue-600 text-lg">
                    {formatCurrencyDecimal(monthlyPayment)}
                  </span>
                </div>
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
    </div>
  );
};

export default MortgageCalculator;