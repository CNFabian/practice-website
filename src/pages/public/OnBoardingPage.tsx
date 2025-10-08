// src/pages/onboarding/OnBoardingPage.tsx
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Question = { id: string; label: string; options: string[]; helpText?: string }

const STEPS: Question[] = [
  { id: 'avatar', label: 'Choose Your Avatar', options: ['Curious Cat','Celebrating Bird','Careful Elephant','Protective Dog'] },
  { id: 'Home Ownership', label: 'When do you want to achieve homeownership?', options: [], helpText: 'This helps us customize your learning path and set realistic goals.' },
  { id: 'learn', label: 'How do you prefer to learn?', options: ['Reading','Videos','Quizzes/Games','Other'], helpText: 'We’ll personalize your experience based on your learning preferences.' },
  { id: 'realtor', label: 'Are you currently working with a realtor?', options: ['Yes, I have a realtor','No, I dont have one yet'], helpText: 'A realtor can help you navigate the home buying process.' },
  { id: 'loan_officer', label: 'Are you currently working with a loan officer?', options: ['Yes, I have a loan officer','No, I dont have one yet'], helpText: 'A loan officer can help you secure the best mortgage for your situation.' },
  { id: 'reward', label: 'What type of rewards motivate you most?', options: ['Home Improvement','Expert Consultation','In-Game Currency'], helpText: 'We’ll customize your reward experience based on your preferences.' },
   { id: 'share', label: 'Share your homeownership journey!', options: [], helpText: 'Let your friends and family know about your exciting journey toward homeownership.' },
  { id: 'complete', label: 'Congratulations on completing your profile!', options: [], helpText: "You've taken the first important step toward homeownership" },
]

/*  (swap with JPGs later) */
const LEARN_SUB: Record<string,string> = {
  Reading:'Learn through articles and guides', Videos:'Watch educational content',
  'Quizzes/Games':'Interactive learning experiences', Other:'Mixed learning approaches',
}
const AVATAR_ICON: Record<string,string> = {
  'Curious Cat':'😺','Celebrating Bird':'🐦','Careful Elephant':'🐘','Protective Dog':'🐶',
}
const LEARN_ICON: Record<string,string> = {
  Reading:'📚', Videos:'🎥', 'Quizzes/Games':'🎮', Other:'💡',
}
const REWARD_SUB: Record<string,string> = {
  'Home Improvement':'Tools and supplies for your future home',
  'Expert Consultation':'Free sessions with real estate professionals',
  'In-Game Currency':'Coins to unlock premium features',
}
const REWARD_ICON: Record<string,string> = { 'Home Improvement':'🏠','Expert Consultation':'🧑‍💼','In-Game Currency':'🏛️' }

const SLIDER = { min:6, max:60, step:1, defaultValue:24, unit:'months', minLabel:'6 months', maxLabel:'5 years' }
const SHARE_TEXT = '🏠 I’m on my path to homeownership with Nest Navigate! Join me on this exciting journey to achieve the dream of homeownership. #HomeownershipGoals #NestNavigate'

const cx = (...c: (string|false)[]) => c.filter(Boolean).join(' ')
const Ring = ({ active }: { active:boolean }) => (
  <span className={cx('pointer-events-none absolute inset-0 rounded-2xl ring-2 ring-offset-2', active?'ring-indigo-600/0':'ring-transparent group-focus:ring-indigo-600')} aria-hidden />
)

export default function OnBoardingPage() {
  const nav = useNavigate()
  const [answers, setAns] = useState<Record<string,string>>({})
  const [step, setStep] = useState(0)
  const cur = STEPS[step]
  const total = STEPS.length

  useEffect(() => {
    if (cur.id === 'Home Ownership' && !answers[cur.id]) setAns(p => ({ ...p, [cur.id]: String(SLIDER.defaultValue) }))
    if (cur.id === 'share' && !answers.share) setAns(p => ({ ...p, share:'ready' }))
    if (cur.id === 'complete' && !answers.complete) setAns(p => ({ ...p, complete:'done' }))
  }, [cur.id]) // eslint-disable-line

  const allAnswered = useMemo(() => STEPS.every(s => !!answers[s.id]), [answers])
  const progressPct = Math.round(((step + (answers[cur.id] ? 1 : 0)) / total) * 100)
  const select = (id:string,v:string) => setAns(p => ({ ...p, [id]: v }))


  const Progress = () => (
    <div className="px-6 pt-6 sm:px-8 mb-2">
      <div className="flex items-center justify-between text-sm text-gray-600"><span className="sr-only">Progress</span><span className="invisible">.</span><span>Step {step+1} of {total}</span></div>
      <div className="mt-1 h-2 w-full rounded-full bg-gray-200 overflow-hidden"><div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progressPct}%` }}/></div>
    </div>
  )

  type CardGridProps = {
    name?: string
    opts: string[]
    subMap?: Record<string,string>
    iconMap?: Record<string,string>
    threeCol?: boolean
  }
  const CardGrid = ({ name=cur.id, opts, subMap, iconMap, threeCol=false }: CardGridProps) => (
    <fieldset className="mt-4" aria-label={cur.label}>
      <legend className="sr-only">{cur.label}</legend>
      <div className={cx('grid gap-4', threeCol ? 'mx-auto max-w-3xl grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2')}>
        {opts.map(o => {
          const sel = answers[name] === o
          const id = `${name}-${o.replace(/\s+|\/+/g,'-').toLowerCase()}`
          const sub = subMap?.[o]
          const icon = iconMap?.[o]
          return (
            <label key={o} htmlFor={id} className={cx(
              'group relative isolate cursor-pointer rounded-2xl border bg-white p-5 text-center transition',
              'shadow-sm hover:shadow',
              sel ? 'border-indigo-600 bg-indigo-50 shadow-[0_0_0_4px_rgba(99,102,241,0.12)]' : 'border-gray-200 hover:bg-gray-50'
            )}>
              {(icon) && (
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-2xl">
                  <span aria-hidden>{icon}</span>
                </div>
              )}
              <div className="text-base font-semibold text-gray-900">{o}</div>
              {sub && <div className="mt-1 text-sm text-gray-600">{sub}</div>}
              <input id={id} type="radio" name={name} value={o} checked={sel} onChange={() => select(name,o)} className="sr-only" />
              <Ring active={sel} />
            </label>
          )
        })}
      </div>
    </fieldset>
  )

  const Slider = () => {
    const v = Number(answers['Home Ownership'] ?? SLIDER.defaultValue)
    return (
      <div className="rounded-2xl border border-gray-200 p-6 sm:p-8">
        <div className="text-center">
          <div className="text-5xl font-semibold text-indigo-700 tabular-nums">{v}</div>
          <div className="mt-1 text-sm text-gray-600">{SLIDER.unit}</div>
        </div>
        <div className="mt-8">
          <input type="range" min={SLIDER.min} max={SLIDER.max} step={SLIDER.step} value={v}
                 onChange={e => select('Home Ownership', e.target.value)} className="w-full accent-indigo-600" aria-label="Homeownership timeline (months)"/>
          <div className="mt-3 flex items-center justify-between text-sm text-gray-600"><span>{SLIDER.minLabel}</span><span>{SLIDER.maxLabel}</span></div>
        </div>
      </div>
    )
  }

  const Share = () => {
    const open = (u:string) => window.open(u, '_blank', 'noopener,noreferrer')
    const copy = async () => (await navigator.clipboard.writeText(SHARE_TEXT), alert('Copied your share text to clipboard!'))
    const url  = encodeURIComponent('https://nestnavigate.example/')
    const txt  = encodeURIComponent(SHARE_TEXT)
    return (
      <div className="rounded-2xl border border-gray-200 p-6 sm:p-8">
        <div className="rounded-2xl bg-gray-50 px-5 py-6 text-center text-gray-800"><p className="leading-relaxed">{SHARE_TEXT}</p></div>
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button onClick={()=>open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${txt}`)} className="rounded-xl border px-4 py-2.5 font-medium text-blue-600 border-blue-200 hover:bg-blue-50">Facebook</button>
          <button onClick={()=>open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`)} className="rounded-xl border px-4 py-2.5 font-medium text-sky-700 border-sky-200 hover:bg-sky-50">LinkedIn</button>
          <button onClick={copy} className="rounded-xl border px-4 py-2.5 font-medium text-pink-600 border-pink-200 hover:bg-pink-50">Instagram</button>
          <button onClick={()=>open(`https://twitter.com/intent/tweet?text=${txt}&url=${url}`)} className="rounded-xl border px-4 py-2.5 font-medium text-rose-600 border-rose-200 hover:bg-rose-50">Twitter</button>
        </div>
        <div className="mt-6 flex justify-center">
          {'share' in navigator
            ? <button onClick={() => (navigator as any).share({ text: SHARE_TEXT })} className="px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">Share my profile</button>
            : <button onClick={copy} className="px-6 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">Share my profile</button>}
        </div>
      </div>
    )
  }

  const Complete = () => (
    <div className="rounded-2xl border border-gray-200 p-6 sm:p-10 text-center">
      <div className="text-5xl mb-4">🎉</div>
      <h3 className="text-2xl font-semibold">Congratulations on completing your profile!</h3>
      <p className="mt-2 text-gray-600">You&apos;ve taken the first important step toward homeownership</p>
      <div className="mx-auto mt-8 w-full max-w-xs rounded-2xl bg-gradient-to-b from-yellow-300 to-yellow-400 p-1">
        <div className="rounded-2xl bg-gradient-to-b from-yellow-200 to-yellow-300 px-6 py-5">
          <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-yellow-500/40 flex items-center justify-center"><span className="text-xl">🪙</span></div>
          <div className="text-lg font-bold text-yellow-900">+25 Coins Earned!</div>
          <div className="text-sm text-yellow-900/80 mt-1">Great job completing your profile setup</div>
        </div>
      </div>
    </div>
  )

  const renderStep = () => {
    if (cur.id === 'Home Ownership') return <Slider />
    if (cur.id === 'reward') return <CardGrid name="reward" opts={cur.options} subMap={REWARD_SUB} iconMap={REWARD_ICON} threeCol />
    if (cur.id === 'learn')  return <CardGrid name="learn"  opts={cur.options} subMap={LEARN_SUB}  iconMap={LEARN_ICON} />
    if (cur.id === 'avatar') return <CardGrid name="avatar" opts={cur.options} iconMap={AVATAR_ICON} />
    if (cur.id === 'share')  return <Share />
    if (cur.id === 'complete') return <Complete />
    return <CardGrid opts={cur.options} /> // realtor, loan_officer, experience
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
