interface ProfessionalHelpScreenProps {
  value: string
  onChange: (value: string) => void
}

export const ProfessionalHelpScreen: React.FC<ProfessionalHelpScreenProps> = ({ value, onChange }) => {
  // Parse the value to handle multiple selections
  const selections = value ? value.split(',').filter(Boolean) : []
  const hasRealtor = selections.includes('realtor')
  const hasRealtorNo = selections.includes('realtor_no')
  const hasLoanOfficer = selections.includes('loan_officer')
  const hasLoanOfficerNo = selections.includes('loan_officer_no')

  const toggleSelection = (type: 'realtor' | 'loan_officer', isYes: boolean) => {
    let newSelections = [...selections]
    
    if (type === 'realtor') {
      // Remove both realtor options first
      newSelections = newSelections.filter(s => s !== 'realtor' && s !== 'realtor_no')
      // Add the selected option
      newSelections.push(isYes ? 'realtor' : 'realtor_no')
    } else {
      // Remove both loan officer options first
      newSelections = newSelections.filter(s => s !== 'loan_officer' && s !== 'loan_officer_no')
      // Add the selected option
      newSelections.push(isYes ? 'loan_officer' : 'loan_officer_no')
    }

    // Update the value
    onChange(newSelections.join(','))
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Real Estate Officer Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Are you working with a real estate officer?
        </h3>
        <div className="flex justify-center gap-8">
          <button
            onClick={() => toggleSelection('realtor', true)}
            className="flex items-center gap-3 group"
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              hasRealtor 
                ? 'border-indigo-600 bg-indigo-600' 
                : 'border-gray-300 group-hover:border-indigo-400'
            }`}>
              {hasRealtor && (
                <div className="w-3 h-3 rounded-full bg-white"></div>
              )}
            </div>
            <span className="text-gray-700 font-medium">Yes</span>
          </button>

          <button
            onClick={() => toggleSelection('realtor', false)}
            className="flex items-center gap-3 group"
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              hasRealtorNo 
                ? 'border-indigo-600 bg-indigo-600' 
                : 'border-gray-300 group-hover:border-indigo-400'
            }`}>
              {hasRealtorNo && (
                <div className="w-3 h-3 rounded-full bg-white"></div>
              )}
            </div>
            <span className="text-gray-700 font-medium">No</span>
          </button>
        </div>
      </div>

      {/* Loan Officer Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Are you working with a loan officer?
        </h3>
        <div className="flex justify-center gap-8">
          <button
            onClick={() => toggleSelection('loan_officer', true)}
            className="flex items-center gap-3 group"
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              hasLoanOfficer 
                ? 'border-indigo-600 bg-indigo-600' 
                : 'border-gray-300 group-hover:border-indigo-400'
            }`}>
              {hasLoanOfficer && (
                <div className="w-3 h-3 rounded-full bg-white"></div>
              )}
            </div>
            <span className="text-gray-700 font-medium">Yes</span>
          </button>

          <button
            onClick={() => toggleSelection('loan_officer', false)}
            className="flex items-center gap-3 group"
          >
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              hasLoanOfficerNo 
                ? 'border-indigo-600 bg-indigo-600' 
                : 'border-gray-300 group-hover:border-indigo-400'
            }`}>
              {hasLoanOfficerNo && (
                <div className="w-3 h-3 rounded-full bg-white"></div>
              )}
            </div>
            <span className="text-gray-700 font-medium">No</span>
          </button>
        </div>
      </div>
    </div>
  )
}