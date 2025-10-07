interface CardGridScreenProps {
  name: string
  label: string
  opts: string[]
  value: string
  onChange: (value: string) => void
  subMap?: Record<string, string>
  iconMap?: Record<string, string>
  threeCol?: boolean
}

export const CardGridScreen: React.FC<CardGridScreenProps> = ({ 
  opts, 
  value, 
  onChange, 
  subMap, 
  iconMap, 
  threeCol 
}) => {
  return (
    <div className={`grid gap-4 ${threeCol ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
      {opts.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`p-4 rounded-lg border-2 transition-all text-left ${
            value === opt
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          {iconMap && iconMap[opt] && (
            <div className="text-3xl mb-2">{iconMap[opt]}</div>
          )}
          <div className="font-semibold">{opt}</div>
          {subMap && subMap[opt] && (
            <div className="text-sm text-gray-600 mt-1">{subMap[opt]}</div>
          )}
        </button>
      ))}
    </div>
  )
}