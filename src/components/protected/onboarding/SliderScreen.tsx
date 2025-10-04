// src/pages/public/onboarding/screens/SliderScreen.tsx
import { useState } from 'react'

const SLIDER = { min:6, max:60, step:1, defaultValue:24, unit:'months', minLabel:'6 months', maxLabel:'5 years' }

interface SliderScreenProps {
  value: string
  onChange: (value: string) => void
}

export const SliderScreen: React.FC<SliderScreenProps> = ({ value, onChange }) => {
  const val = Number(value || SLIDER.defaultValue)
  const [show, setShow] = useState(val)

  return (
    <div className="mt-4">
      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-indigo-600">{show} {SLIDER.unit}</div>
      </div>
      <input
        type="range"
        min={SLIDER.min}
        max={SLIDER.max}
        step={SLIDER.step}
        value={val}
        onChange={e => { setShow(Number(e.target.value)); onChange(e.target.value) }}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />
      <div className="flex justify-between text-sm text-gray-500 mt-2">
        <span>{SLIDER.minLabel}</span>
        <span>{SLIDER.maxLabel}</span>
      </div>
    </div>
  )
}