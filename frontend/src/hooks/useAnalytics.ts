// ════════════════════════════════════════════════════════════════
// Analytics Event Helpers — Nest Navigate Phase 1 Funnel Tracking
// ════════════════════════════════════════════════════════════════
//
// 🔴 CRITICAL DEV NOTES (apply to ALL events in this file):
//
//   1. Do NOT fire submit events on button click.
//      Always wait for backend success response for true measurement.
//      → sign_up_submit, login_success, onboarding_complete,
//        path_step_complete, lead_submit all fire in onSuccess handlers.
//
//   2. Deduplicate route-based events.
//      path_step_view uses a module-level ref so it never double-fires
//      on re-render or fast refresh of the same lesson.
//
// Funnel: cta_click → sign_up_start → sign_up_submit → login_success
//       → onboarding_start → onboarding_complete
//       → path_step_view → path_step_complete → tool_open → lead_submit
//
// ════════════════════════════════════════════════════════════════

import ReactGA from 'react-ga4'

// ── Marketing / Public ────────────────────────────────────────

/**
 * cta_click — fired on click of any primary CTA button.
 * Trigger: onClick (before redirect). This is intentionally click-based,
 * not backend-gated, since CTAs are navigation/intent signals.
 * @param label  Human-readable button label (e.g. "Get Started", "Log in")
 * @param location  Where on the page (e.g. "hero", "header", "signup_form")
 */
export const trackCtaClick = (label: string, location?: string) => {
  ReactGA.event('cta_click', {
    label,
    location: location ?? 'unknown',
  })
}

// ── Authentication ────────────────────────────────────────────

/**
 * sign_up_start — fired on first form interaction during signup.
 * Trigger: first focus/change on the email input field.
 * Use a ref in the component to ensure this fires only once per session.
 */
export const trackSignUpStart = () => {
  ReactGA.event('sign_up_start')
}

/**
 * sign_up_submit — fired ONLY after backend confirms account created.
 * 🔴 Do NOT call on button click — call inside the try block after
 *    registerUser() resolves successfully.
 */
export const trackSignUpSubmit = () => {
  ReactGA.event('sign_up_submit')
}

/**
 * login_success — fired ONLY after backend confirms authentication.
 * 🔴 Do NOT call on button click — call after loginUser() + getCurrentUser()
 *    resolve successfully and the user profile is dispatched to Redux.
 */
export const trackLoginSuccess = () => {
  ReactGA.event('login_success')
}

// ── Activation ───────────────────────────────────────────────

/**
 * onboarding_start — fired when the onboarding flow renders for the first time.
 * Trigger: useEffect on component mount (step 0 view).
 * Use a ref to prevent re-firing if the component remounts.
 */
export const trackOnboardingStart = () => {
  ReactGA.event('onboarding_start')
}

/**
 * onboarding_complete — fired ONLY after all onboarding steps submit successfully.
 * 🔴 Do NOT call on button click — call after all completeStep() API calls
 *    resolve and just before dispatching the 'onboarding-completed' window event.
 */
export const trackOnboardingComplete = () => {
  ReactGA.event('onboarding_complete')
}

// ── Engagement ───────────────────────────────────────────────

/**
 * path_step_view — fired when a user loads a lesson/learning step.
 * 🔴 DEDUPLICATION: Only fires if the lessonId changed since last fire.
 *    Uses a module-level ref — safe across re-renders and fast refresh.
 * Trigger: useEffect on lesson component mount / lesson prop change.
 * @param lessonId   Backend UUID of the lesson
 * @param lessonTitle  Human-readable lesson title
 * @param moduleTitle  Parent module title
 */
export const trackPathStepView = (
  lessonId: string,
  lessonTitle?: string,
  moduleTitle?: string
) => {
  ReactGA.event('path_step_view', {
    lesson_id: lessonId,
    lesson_title: lessonTitle ?? 'unknown',
    module_title: moduleTitle ?? 'unknown',
  })
}

/**
 * path_step_complete — fired ONLY after backend confirms lesson completion.
 * 🔴 Do NOT call on button click — call inside completeLessonMutation onSuccess.
 * @param lessonId   Backend UUID of the lesson
 * @param lessonTitle  Human-readable lesson title
 * @param completionMethod  How completion was triggered: 'manual' | 'auto' | 'milestone'
 */
export const trackPathStepComplete = (
  lessonId: string,
  lessonTitle?: string,
  completionMethod?: 'manual' | 'auto' | 'milestone'
) => {
  ReactGA.event('path_step_complete', {
    lesson_id: lessonId,
    lesson_title: lessonTitle ?? 'unknown',
    completion_method: completionMethod ?? 'manual',
  })
}

/**
 * tool_open — fired when a tool modal/panel loads (calculator, checklist, etc.).
 * Trigger: when the user clicks to open a specific tool (handleCalculatorClick,
 *          handleChecklistClick, handleCategoryClick for tools tabs).
 * @param toolName  Identifier for the tool (e.g. 'mortgage_calculator', 'home_inspection_checklist')
 */
export const trackToolOpen = (toolName: string) => {
  ReactGA.event('tool_open', {
    tool_name: toolName,
  })
}

// ── Conversion ───────────────────────────────────────────────

/**
 * lead_submit — North Star conversion metric.
 * 🔴 Do NOT call on button click — call ONLY after backend confirms
 *    successful form submission (onSuccess handler).
 * @param formType  Which form was submitted (e.g. 'support_ticket', 'contact', 'expert_request')
 */
export const trackLeadSubmit = (formType: string) => {
  ReactGA.event('lead_submit', {
    form_type: formType,
  })
}
