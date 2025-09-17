import React, { useState, useEffect } from 'react';

const DebtToIncomeCalculator: React.FC = () => {
  const [monthlyIncome, setMonthlyIncome] = useState<string>('');
  const [mortgagePayment, setMortgagePayment] = useState<string>('');
  const [creditCardPayments, setCreditCardPayments] = useState<string>('');
  const [carPayments, setCarPayments] = useState<string>('');
  const [studentLoans, setStudentLoans] = useState<string>('');
  const [otherDebts, setOtherDebts] = useState<string>('');

  const [dtiRatio, setDtiRatio] = useState<number>(0);
  const [frontEndRatio, setFrontEndRatio] = useState<number>(0);
  const [backEndRatio, setBackEndRatio] = useState<number>(0);

  useEffect(() => {
    const income = parseFloat(monthlyIncome) || 0;
    const mortgage = parseFloat(mortgagePayment) || 0;
    const creditCards = parseFloat(creditCardPayments) || 0;
    const car = parseFloat(carPayments) || 0;
    const student = parseFloat(studentLoans) || 0;
    const other = parseFloat(otherDebts) || 0;

    const totalDebts = mortgage + creditCards + car + student + other;
    
    if (income > 0) {
      setFrontEndRatio((mortgage / income) * 100);
      setBackEndRatio((totalDebts / income) * 100);
      setDtiRatio((totalDebts / income) * 100);
    } else {
      setFrontEndRatio(0);
      setBackEndRatio(0);
      setDtiRatio(0);
    }
  }, [monthlyIncome, mortgagePayment, creditCardPayments, carPayments, studentLoans, otherDebts]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDTICategory = (ratio: number): { level: string; color: string; description: string } => {
    if (ratio <= 20) {
      return {
        level: 'Excellent',
        color: 'text-green-600 bg-green-50 border-green-200',
        description: 'You have excellent debt management with plenty of room for additional credit.'
      };
    } else if (ratio <= 36) {
      return {
        level: 'Good',
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        description: 'You have healthy debt levels that most lenders prefer to see.'
      };
    } else if (ratio <= 43) {
      return {
        level: 'Fair',
        color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
        description: 'Your debt levels are manageable but you may face some lending restrictions.'
      };
    } else {
      return {
        level: 'High',
        color: 'text-red-600 bg-red-50 border-red-200',
        description: 'Your debt levels are high and may limit your borrowing options.'
      };
    }
  };

  const category = getDTICategory(dtiRatio);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="mb-6">
            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl">⚖️</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Debt-to-Income Calculator
            </h2>
            <p className="text-gray-600 text-center text-sm">
              Calculate your debt-to-income ratio to understand your borrowing capacity
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
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="5,000"
                />
              </div>
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
                  value={mortgagePayment}
                  onChange={(e) => setMortgagePayment(e.target.value)}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="1,200"
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
                    value={creditCardPayments}
                    onChange={(e) => setCreditCardPayments(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="150"
                  />
                </div>
              </div>

              {/* Car Payments */}
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Car Loan Payments
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={carPayments}
                    onChange={(e) => setCarPayments(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="350"
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
                    value={studentLoans}
                    onChange={(e) => setStudentLoans(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="200"
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
                    value={otherDebts}
                    onChange={(e) => setOtherDebts(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
          {/* DTI Ratio Card */}
          <div className={`rounded-2xl p-6 border-2 ${category.color}`}>
            <h3 className="text-lg font-semibold mb-4">Your Debt-to-Income Ratio</h3>
            <div className="text-4xl font-bold mb-2">
              {dtiRatio.toFixed(1)}%
            </div>
            <div className="text-lg font-semibold mb-2">
              {category.level}
            </div>
            <p className="text-sm">
              {category.description}
            </p>
          </div>

          {/* Ratio Breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ratio Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Front-End Ratio (Housing Only)</span>
                  <span className="font-semibold text-gray-900">
                    {frontEndRatio.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(frontEndRatio, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Recommended: ≤ 28%</p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Back-End Ratio (Total Debt)</span>
                  <span className="font-semibold text-gray-900">
                    {backEndRatio.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(backEndRatio, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Recommended: ≤ 36%</p>
              </div>
            </div>
          </div>

          {/* Monthly Summary */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Gross Monthly Income</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(parseFloat(monthlyIncome) || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Monthly Debts</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(
                    (parseFloat(mortgagePayment) || 0) +
                    (parseFloat(creditCardPayments) || 0) +
                    (parseFloat(carPayments) || 0) +
                    (parseFloat(studentLoans) || 0) +
                    (parseFloat(otherDebts) || 0)
                  )}
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Remaining Income</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(
                      (parseFloat(monthlyIncome) || 0) -
                      ((parseFloat(mortgagePayment) || 0) +
                       (parseFloat(creditCardPayments) || 0) +
                       (parseFloat(carPayments) || 0) +
                       (parseFloat(studentLoans) || 0) +
                       (parseFloat(otherDebts) || 0))
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips to Improve Your DTI</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Pay down existing debt balances</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Increase your income through raises or side work</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Avoid taking on new debt before applying for a mortgage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>Consider a longer loan term to reduce monthly payments</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebtToIncomeCalculator;