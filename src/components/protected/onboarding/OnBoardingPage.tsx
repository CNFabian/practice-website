import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SliderScreen, CardGridScreen } from './screens'
import { CitySearchScreen } from './screens'
import { ProfessionalHelpScreen } from './screens'
import { ExpertContactScreen } from './screens'

type Question = { id: string; label: string; options: string[]; helpText?: string }

const STEPS: Question[] = [
  { 
    id: 'avatar', 
    label: 'Choose Your Avatar', 
    options: ['Curious Cat','Celebrating Bird','Careful Elephant','Protective Dog'],
    helpText: 'Select an avatar that represents you on your homeownership journey'
  },
  { 
    id: 'professional_help', 
    label: 'Buying a home is easier with the right help. Would you like us to connect you with a loan officer or real estate agent?', 
    options: [],
    helpText: ''
  },
  { 
    id: 'expert_contact', 
    label: 'Would you like to get in contact with an expert?', 
    options: [],
    helpText: 'Buying a home is easier with the right help. Would you like us to connect you with a loan officer or real estate agent?'
  },
  { 
    id: 'Home Ownership', 
    label: 'When do you want to achieve homeownership?', 
    options: [], 
    helpText: 'This helps us customize your learning path and set realistic goals.' 
  },
  { 
    id: 'city', 
    label: "Finally, let's find your future home base! Select cities you're interested in:", 
    options: [],
    helpText: ''
  },
]

const AVATAR_ICON: Record<string,string> = {
  'Curious Cat':'😺','Celebrating Bird':'🐦','Careful Elephant':'🐘','Protective Dog':'🐶',
}

const SLIDER = { min:6, max:60, step:1, defaultValue:28, unit:'months', minLabel:'6 months', maxLabel:'5 years' }

const cx = (...c: (string|false)[]) => c.filter(Boolean).join(' ')

export default function OnBoardingPage() {
  const nav = useNavigate()
  const [answers, setAns] = useState<Record<string,string>>({})
  const [step, setStep] = useState(0)
  const cur = STEPS[step]
  const total = STEPS.length

  useEffect(() => {
    if (cur.id === 'Home Ownership' && !answers[cur.id]) {
      setAns(p => ({ ...p, [cur.id]: String(SLIDER.defaultValue) }))
    }
  }, [cur.id]) // eslint-disable-line

  const allAnswered = useMemo(() => STEPS.every(s => !!answers[s.id]), [answers])
  const progressPct = Math.round(((step + (answers[cur.id] ? 1 : 0)) / total) * 100)
  const select = (id:string,v:string) => setAns(p => ({ ...p, [id]: v }))

  const Progress = () => (
    <div className="px-6 pt-6 sm:px-8 mb-2">
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span className="sr-only">Progress</span>
        <span className="invisible">.</span>
        <span>Step {step+1} of {total}</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progressPct}%` }}/>
      </div>
    </div>
  )

  const renderStep = () => {
    if (cur.id === 'avatar') {
      return <CardGridScreen name="avatar" label={cur.label} opts={cur.options} value={answers.avatar} onChange={(v: string) => select('avatar', v)} iconMap={AVATAR_ICON} />
    }
    if (cur.id === 'professional_help') {
      return <ProfessionalHelpScreen value={answers.professional_help} onChange={(v: string) => select('professional_help', v)} />
    }
    if (cur.id === 'expert_contact') {
      return <ExpertContactScreen value={answers.expert_contact} onChange={(v: string) => select('expert_contact', v)} />
    }
    if (cur.id === 'Home Ownership') {
      return <SliderScreen value={answers[cur.id]} onChange={(v: string) => select(cur.id, v)} />
    }
    if (cur.id === 'city') {
      return <CitySearchScreen value={answers.city} onChange={(v: string) => select('city', v)} />
    }
    return <CardGridScreen name={cur.id} label={cur.label} opts={cur.options} value={answers[cur.id]} onChange={(v: string) => select(cur.id, v)} />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/30 backdrop-blur-sm" aria-label="Close onboarding" onClick={()=>nav('/app',{replace:true})}/>
      <div className="relative z-10 w-full max-w-3xl mx-4 rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <Progress />
        <div className="p-6 sm:p-8">
          <header className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight">{cur.label}</h2>
            {cur.helpText && <p className="mt-2 text-gray-600">{cur.helpText}</p>}
          </header>

          {renderStep()}

          <div className="mt-8 flex items-center justify-between">
            <button onClick={()=>setStep(s=>Math.max(0,s-1))} disabled={step===0} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 disabled:opacity-60 hover:bg-gray-50">Previous</button>
            {step < total-1 ? (
              <button onClick={()=>setStep(s=>Math.min(total-1,s+1))} disabled={!answers[cur.id]} className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white disabled:opacity-60 disabled:cursor-not-allowed hover:bg-indigo-700">Next</button>
            ) : (
              <button onClick={()=>nav('/app',{replace:true})} disabled={!allAnswered} className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white disabled:opacity-60 disabled:cursor-not-allowed hover:bg-indigo-700">Complete</button>
            )}
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            {STEPS.map((_,i)=><span key={i} className={cx('h-2 w-2 rounded-full', i===step?'bg-indigo-600':'bg-gray-300')} aria-hidden />)}
          </div>
        </div>
      </div>
    </div>
  )
}