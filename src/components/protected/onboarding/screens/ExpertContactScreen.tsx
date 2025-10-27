interface ExpertContactScreenProps {
  value: string
  onChange: (value: string) => void
}

export const ExpertContactScreen: React.FC<ExpertContactScreenProps> = ({ value, onChange }) => {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => onChange('Yes')}
          className={`px-8 py-4 rounded-xl border-2 transition-all font-medium text-gray-700 ${
            value === 'Yes'
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
          }`}
        >
          Yes, I'd love to!
        </button>

        <button
          onClick={() => onChange('Maybe later')}
          className={`px-8 py-4 rounded-xl border-2 transition-all font-medium text-gray-700 ${
            value === 'Maybe later'
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300'
          }`}
        >
          Maybe later.
        </button>
      </div>
    </div>
  )
}