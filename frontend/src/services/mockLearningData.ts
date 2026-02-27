// ═══════════════════════════════════════════════════════════════
// MOCK LEARNING DATA
// Fallback data used when backend learning data is not available
// (e.g., when using mock module IDs like 'mock-module-1')
// All data structures match the backend API response schemas exactly
// ═══════════════════════════════════════════════════════════════

const MOCK_MODULE_ID = '00000000-0000-4000-a000-000000000001';

const MOCK_LESSON_IDS = [
  '00000000-0000-4000-b000-000000000001',
  '00000000-0000-4000-b000-000000000002',
  '00000000-0000-4000-b000-000000000003',
  '00000000-0000-4000-b000-000000000004',
];

const MOCK_QUESTION_IDS = {
  L1_Q1: '00000000-0000-4000-c001-000000000001',
  L1_Q2: '00000000-0000-4000-c001-000000000002',
  L1_Q3: '00000000-0000-4000-c001-000000000003',
  L2_Q1: '00000000-0000-4000-c002-000000000001',
  L2_Q2: '00000000-0000-4000-c002-000000000002',
  L2_Q3: '00000000-0000-4000-c002-000000000003',
  L3_Q1: '00000000-0000-4000-c003-000000000001',
  L3_Q2: '00000000-0000-4000-c003-000000000002',
  L3_Q3: '00000000-0000-4000-c003-000000000003',
  L4_Q1: '00000000-0000-4000-c004-000000000001',
  L4_Q2: '00000000-0000-4000-c004-000000000002',
  L4_Q3: '00000000-0000-4000-c004-000000000003',
  FR_Q1: '00000000-0000-4000-c005-000000000001',
  FR_Q2: '00000000-0000-4000-c005-000000000002',
  FR_Q3: '00000000-0000-4000-c005-000000000003',
  FR_Q4: '00000000-0000-4000-c005-000000000004',
  FR_Q5: '00000000-0000-4000-c005-000000000005',
  FR_Q6: '00000000-0000-4000-c005-000000000006',
};

let answerCounter = 0;
const makeAnswerId = () => {
  answerCounter++;
  const hex = answerCounter.toString(16).padStart(12, '0');
  return `00000000-0000-4000-d000-${hex}`;
};

// ═══════════════════════════════════════════════════════════════
// MOCK LESSONS — matches GET /api/learning/modules/{module_id}/lessons
// ═══════════════════════════════════════════════════════════════

const MOCK_LESSONS_DATA: any[] = [
  {
    id: MOCK_LESSON_IDS[0],
    module_id: MOCK_MODULE_ID,
    title: 'What is a Mortgage?',
    description: 'Understanding the basics of home loans and how mortgages work.',
    lesson_summary: 'A mortgage is a loan used to purchase a home. The home itself serves as collateral. You\'ll learn about principal, interest, and how monthly payments are structured.',
    image_url: null,
    video_url: 'https://www.youtube.com/embed/6uyoAsHlbc8',
    video_transcription: null,
    order_index: 0,
    is_active: true,
    estimated_duration_minutes: 10,
    nest_coins_reward: 25,
    created_at: '2026-01-01T00:00:00.000Z',
    is_completed: false,
    progress_seconds: 0,
    grow_your_nest_played: false,
  },
  {
    id: MOCK_LESSON_IDS[1],
    module_id: MOCK_MODULE_ID,
    title: 'Down Payments Explained',
    description: 'How much do you really need to put down, and what are your options?',
    lesson_summary: 'A down payment is the upfront amount you pay when buying a home. Learn about conventional 20% down payments, FHA loans with 3.5% down, and down payment assistance programs.',
    image_url: null,
    video_url: 'https://www.youtube.com/embed/6uyoAsHlbc8',
    video_transcription: null,
    order_index: 1,
    is_active: true,
    estimated_duration_minutes: 12,
    nest_coins_reward: 25,
    created_at: '2026-01-01T00:00:00.000Z',
    is_completed: false,
    progress_seconds: 0,
    grow_your_nest_played: false,
  },
  {
    id: MOCK_LESSON_IDS[2],
    module_id: MOCK_MODULE_ID,
    title: 'Understanding APR & Interest Rates',
    description: 'The difference between interest rates and APR, and why it matters.',
    lesson_summary: 'APR (Annual Percentage Rate) includes your interest rate PLUS fees, giving you the true cost of borrowing. Learn how to compare loan offers and understand what affects your rate.',
    image_url: null,
    video_url: 'https://www.youtube.com/embed/6uyoAsHlbc8',
    video_transcription: null,
    order_index: 2,
    is_active: true,
    estimated_duration_minutes: 11,
    nest_coins_reward: 25,
    created_at: '2026-01-01T00:00:00.000Z',
    is_completed: false,
    progress_seconds: 0,
    grow_your_nest_played: false,
  },
  {
    id: MOCK_LESSON_IDS[3],
    module_id: MOCK_MODULE_ID,
    title: 'Home Equity Basics',
    description: 'What is home equity and how does it build wealth over time?',
    lesson_summary: 'Home equity is the portion of your home that you actually own — the difference between your home\'s value and what you owe. Learn how equity builds through payments and appreciation.',
    image_url: null,
    video_url: 'https://www.youtube.com/embed/6uyoAsHlbc8',
    video_transcription: null,
    order_index: 3,
    is_active: true,
    estimated_duration_minutes: 12,
    nest_coins_reward: 25,
    created_at: '2026-01-01T00:00:00.000Z',
    is_completed: false,
    progress_seconds: 0,
    grow_your_nest_played: false,
  },
];

// ═══════════════════════════════════════════════════════════════
// MOCK QUIZ DATA — matches GET /api/learning/lessons/{lesson_id}/quiz
// Note: is_correct is NOT included in answers (matches backend security)
// ═══════════════════════════════════════════════════════════════

answerCounter = 0;

const MOCK_QUIZ_DATA: Record<string, any[]> = {
  // ── LESSON 1: What is a Mortgage? ──
  [MOCK_LESSON_IDS[0]]: [
    {
      id: MOCK_QUESTION_IDS.L1_Q1, lesson_id: MOCK_LESSON_IDS[0],
      question_text: 'What is a mortgage?', question_type: 'multiple_choice',
      explanation: 'A mortgage is a loan specifically used to purchase real estate, where the property itself serves as collateral for the loan.',
      order_index: 0,
      answers: [
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L1_Q1, answer_text: 'A type of savings account for homebuyers', order_index: 0 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L1_Q1, answer_text: 'A loan used to purchase a home, secured by the property', order_index: 1 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L1_Q1, answer_text: 'A government grant for first-time homebuyers', order_index: 2 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L1_Q1, answer_text: 'An insurance policy that protects your home', order_index: 3 },
      ],
    },
    {
      id: MOCK_QUESTION_IDS.L1_Q2, lesson_id: MOCK_LESSON_IDS[0],
      question_text: 'What are the two main components of a monthly mortgage payment?', question_type: 'multiple_choice',
      explanation: 'Each monthly mortgage payment consists of principal (paying down the loan balance) and interest (the cost of borrowing the money).',
      order_index: 1,
      answers: [
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L1_Q2, answer_text: 'Principal and interest', order_index: 0 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L1_Q2, answer_text: 'Taxes and insurance', order_index: 1 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L1_Q2, answer_text: 'Down payment and closing costs', order_index: 2 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L1_Q2, answer_text: 'Credit score and income', order_index: 3 },
      ],
    },
    {
      id: MOCK_QUESTION_IDS.L1_Q3, lesson_id: MOCK_LESSON_IDS[0],
      question_text: 'What does it mean that a home "serves as collateral" for a mortgage?', question_type: 'multiple_choice',
      explanation: 'When your home is collateral, it means the lender can take possession of the property (foreclosure) if you fail to make your mortgage payments.',
      order_index: 2,
      answers: [
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L1_Q3, answer_text: 'The home increases in value automatically', order_index: 0 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L1_Q3, answer_text: 'The lender can take the home if you don\'t pay', order_index: 1 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L1_Q3, answer_text: 'You can sell the home at any time without restriction', order_index: 2 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L1_Q3, answer_text: 'The government guarantees the loan', order_index: 3 },
      ],
    },
  ],
  // ── LESSON 2: Down Payments Explained ──
  [MOCK_LESSON_IDS[1]]: [
    {
      id: MOCK_QUESTION_IDS.L2_Q1, lesson_id: MOCK_LESSON_IDS[1],
      question_text: 'What is the traditional recommended down payment percentage for a conventional loan?', question_type: 'multiple_choice',
      explanation: 'The traditional recommendation is 20% down, which allows you to avoid paying Private Mortgage Insurance (PMI).',
      order_index: 0,
      answers: [
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L2_Q1, answer_text: '5%', order_index: 0 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L2_Q1, answer_text: '10%', order_index: 1 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L2_Q1, answer_text: '20%', order_index: 2 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L2_Q1, answer_text: '50%', order_index: 3 },
      ],
    },
    {
      id: MOCK_QUESTION_IDS.L2_Q2, lesson_id: MOCK_LESSON_IDS[1],
      question_text: 'What is the minimum down payment for an FHA loan?', question_type: 'multiple_choice',
      explanation: 'FHA loans allow down payments as low as 3.5% for borrowers with a credit score of 580 or higher.',
      order_index: 1,
      answers: [
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L2_Q2, answer_text: '0%', order_index: 0 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L2_Q2, answer_text: '3.5%', order_index: 1 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L2_Q2, answer_text: '10%', order_index: 2 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L2_Q2, answer_text: '15%', order_index: 3 },
      ],
    },
    {
      id: MOCK_QUESTION_IDS.L2_Q3, lesson_id: MOCK_LESSON_IDS[1],
      question_text: 'What is PMI (Private Mortgage Insurance)?', question_type: 'multiple_choice',
      explanation: 'PMI protects the LENDER (not you) if you default on your loan. It\'s typically required when your down payment is less than 20%.',
      order_index: 2,
      answers: [
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L2_Q3, answer_text: 'Insurance that protects your home from natural disasters', order_index: 0 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L2_Q3, answer_text: 'Insurance that protects the lender if you default on the loan', order_index: 1 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L2_Q3, answer_text: 'Insurance that covers your mortgage payments if you lose your job', order_index: 2 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L2_Q3, answer_text: 'A government program that pays part of your mortgage', order_index: 3 },
      ],
    },
  ],
  // ── LESSON 3: Understanding APR & Interest Rates ──
  [MOCK_LESSON_IDS[2]]: [
    {
      id: MOCK_QUESTION_IDS.L3_Q1, lesson_id: MOCK_LESSON_IDS[2],
      question_text: 'What does APR stand for?', question_type: 'multiple_choice',
      explanation: 'APR stands for Annual Percentage Rate. It represents the total yearly cost of borrowing, including interest and fees.',
      order_index: 0,
      answers: [
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L3_Q1, answer_text: 'Annual Payment Rate', order_index: 0 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L3_Q1, answer_text: 'Annual Percentage Rate', order_index: 1 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L3_Q1, answer_text: 'Adjusted Property Rate', order_index: 2 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L3_Q1, answer_text: 'Approved Purchase Rate', order_index: 3 },
      ],
    },
    {
      id: MOCK_QUESTION_IDS.L3_Q2, lesson_id: MOCK_LESSON_IDS[2],
      question_text: 'Why is the APR typically higher than the interest rate?', question_type: 'multiple_choice',
      explanation: 'APR includes the interest rate PLUS additional costs like origination fees, closing costs, and mortgage insurance.',
      order_index: 1,
      answers: [
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L3_Q2, answer_text: 'Because APR includes fees and other costs on top of interest', order_index: 0 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L3_Q2, answer_text: 'Because APR is calculated differently by each bank', order_index: 1 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L3_Q2, answer_text: 'Because APR includes your down payment amount', order_index: 2 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L3_Q2, answer_text: 'Because APR is based on the property tax rate', order_index: 3 },
      ],
    },
    {
      id: MOCK_QUESTION_IDS.L3_Q3, lesson_id: MOCK_LESSON_IDS[2],
      question_text: 'Which factor has the MOST impact on the interest rate you receive?', question_type: 'multiple_choice',
      explanation: 'Your credit score is the single biggest factor in determining your mortgage interest rate.',
      order_index: 2,
      answers: [
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L3_Q3, answer_text: 'The color of your house', order_index: 0 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L3_Q3, answer_text: 'Your credit score', order_index: 1 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L3_Q3, answer_text: 'The number of bedrooms', order_index: 2 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L3_Q3, answer_text: 'Your age', order_index: 3 },
      ],
    },
  ],
  // ── LESSON 4: Home Equity Basics ──
  [MOCK_LESSON_IDS[3]]: [
    {
      id: MOCK_QUESTION_IDS.L4_Q1, lesson_id: MOCK_LESSON_IDS[3],
      question_text: 'How do you calculate your home equity?', question_type: 'multiple_choice',
      explanation: 'Home equity = Home\'s current market value minus what you still owe on the mortgage.',
      order_index: 0,
      answers: [
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L4_Q1, answer_text: 'Home value minus remaining mortgage balance', order_index: 0 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L4_Q1, answer_text: 'Monthly payment times number of years', order_index: 1 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L4_Q1, answer_text: 'Purchase price minus down payment', order_index: 2 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L4_Q1, answer_text: 'Total interest paid over the loan term', order_index: 3 },
      ],
    },
    {
      id: MOCK_QUESTION_IDS.L4_Q2, lesson_id: MOCK_LESSON_IDS[3],
      question_text: 'Which of these is NOT a way home equity increases?', question_type: 'multiple_choice',
      explanation: 'Refinancing does NOT increase equity by itself — it just restructures your existing loan.',
      order_index: 1,
      answers: [
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L4_Q2, answer_text: 'Making regular mortgage payments', order_index: 0 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L4_Q2, answer_text: 'Property value appreciation', order_index: 1 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L4_Q2, answer_text: 'Refinancing your mortgage to a longer term', order_index: 2 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L4_Q2, answer_text: 'Making home improvements', order_index: 3 },
      ],
    },
    {
      id: MOCK_QUESTION_IDS.L4_Q3, lesson_id: MOCK_LESSON_IDS[3],
      question_text: 'What is a HELOC?', question_type: 'multiple_choice',
      explanation: 'A HELOC (Home Equity Line of Credit) lets you borrow against your home equity as a revolving line of credit.',
      order_index: 2,
      answers: [
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L4_Q3, answer_text: 'A type of home insurance policy', order_index: 0 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L4_Q3, answer_text: 'A revolving line of credit secured by your home equity', order_index: 1 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L4_Q3, answer_text: 'A government program for low-income homebuyers', order_index: 2 },
        { id: makeAnswerId(), question_id: MOCK_QUESTION_IDS.L4_Q3, answer_text: 'A type of property tax deduction', order_index: 3 },
      ],
    },
  ],
};

// ═══════════════════════════════════════════════════════════════
// FREE ROAM EXTRA QUESTIONS
// ═══════════════════════════════════════════════════════════════

const MOCK_FREE_ROAM_EXTRA_QUESTIONS = [
  {
    id: MOCK_QUESTION_IDS.FR_Q1, lesson_id: MOCK_LESSON_IDS[0],
    question_text: 'What is the most common mortgage term length in the United States?', question_type: 'multiple_choice',
    explanation: 'The 30-year fixed-rate mortgage is the most popular choice, offering lower monthly payments spread over a longer period.',
    order_index: 0,
    answers: [
      { id: makeAnswerId(), answer_text: '10 years', order_index: 0 },
      { id: makeAnswerId(), answer_text: '15 years', order_index: 1 },
      { id: makeAnswerId(), answer_text: '30 years', order_index: 2 },
      { id: makeAnswerId(), answer_text: '40 years', order_index: 3 },
    ],
  },
  {
    id: MOCK_QUESTION_IDS.FR_Q2, lesson_id: MOCK_LESSON_IDS[1],
    question_text: 'What is "earnest money" in a home purchase?', question_type: 'multiple_choice',
    explanation: 'Earnest money is a deposit made to the seller showing you are serious about buying. It typically ranges from 1-3% of the purchase price.',
    order_index: 1,
    answers: [
      { id: makeAnswerId(), answer_text: 'The same thing as a down payment', order_index: 0 },
      { id: makeAnswerId(), answer_text: 'A good-faith deposit showing you\'re serious about buying', order_index: 1 },
      { id: makeAnswerId(), answer_text: 'Money the seller pays to the buyer', order_index: 2 },
      { id: makeAnswerId(), answer_text: 'A fee paid to your real estate agent', order_index: 3 },
    ],
  },
  {
    id: MOCK_QUESTION_IDS.FR_Q3, lesson_id: MOCK_LESSON_IDS[2],
    question_text: 'What is the difference between a fixed-rate and adjustable-rate mortgage?', question_type: 'multiple_choice',
    explanation: 'A fixed-rate mortgage keeps the same interest rate for the entire loan term. An adjustable-rate mortgage (ARM) has a rate that can change periodically.',
    order_index: 2,
    answers: [
      { id: makeAnswerId(), answer_text: 'Fixed-rate has the same rate forever; adjustable-rate can change over time', order_index: 0 },
      { id: makeAnswerId(), answer_text: 'There is no difference, they are the same thing', order_index: 1 },
      { id: makeAnswerId(), answer_text: 'Fixed-rate is only for condos; adjustable is for houses', order_index: 2 },
      { id: makeAnswerId(), answer_text: 'Adjustable-rate is always cheaper than fixed-rate', order_index: 3 },
    ],
  },
  {
    id: MOCK_QUESTION_IDS.FR_Q4, lesson_id: MOCK_LESSON_IDS[3],
    question_text: 'What does "being underwater" on a mortgage mean?', question_type: 'multiple_choice',
    explanation: 'Being underwater (or upside-down) means you owe more on your mortgage than your home is currently worth, resulting in negative equity.',
    order_index: 3,
    answers: [
      { id: makeAnswerId(), answer_text: 'Your home was damaged by flooding', order_index: 0 },
      { id: makeAnswerId(), answer_text: 'You owe more on the mortgage than the home is worth', order_index: 1 },
      { id: makeAnswerId(), answer_text: 'Your interest rate is below the prime rate', order_index: 2 },
      { id: makeAnswerId(), answer_text: 'You have too many home improvement projects', order_index: 3 },
    ],
  },
  {
    id: MOCK_QUESTION_IDS.FR_Q5, lesson_id: MOCK_LESSON_IDS[0],
    question_text: 'What is pre-approval for a mortgage?', question_type: 'multiple_choice',
    explanation: 'Pre-approval is when a lender reviews your finances and tells you how much they\'re willing to lend you.',
    order_index: 4,
    answers: [
      { id: makeAnswerId(), answer_text: 'A guarantee that you will get the house you want', order_index: 0 },
      { id: makeAnswerId(), answer_text: 'The final step before closing on a home', order_index: 1 },
      { id: makeAnswerId(), answer_text: 'A lender\'s conditional commitment to lend you a specific amount', order_index: 2 },
      { id: makeAnswerId(), answer_text: 'An inspection of the home before purchasing', order_index: 3 },
    ],
  },
  {
    id: MOCK_QUESTION_IDS.FR_Q6, lesson_id: MOCK_LESSON_IDS[1],
    question_text: 'What are closing costs?', question_type: 'multiple_choice',
    explanation: 'Closing costs are fees and expenses paid at the final step of the home purchase, typically 2-5% of the loan amount.',
    order_index: 5,
    answers: [
      { id: makeAnswerId(), answer_text: 'The cost of closing your old bank account', order_index: 0 },
      { id: makeAnswerId(), answer_text: 'Fees paid at the final step of the home purchase, typically 2-5% of the loan', order_index: 1 },
      { id: makeAnswerId(), answer_text: 'The price of hiring movers', order_index: 2 },
      { id: makeAnswerId(), answer_text: 'The cost of changing the locks on your new home', order_index: 3 },
    ],
  },
];

// ═══════════════════════════════════════════════════════════════
// CORRECT ANSWER MAP (question_id -> correct answer order_index)
// ═══════════════════════════════════════════════════════════════

const MOCK_CORRECT_ANSWERS: Record<string, number> = {
  [MOCK_QUESTION_IDS.L1_Q1]: 1, [MOCK_QUESTION_IDS.L1_Q2]: 0, [MOCK_QUESTION_IDS.L1_Q3]: 1,
  [MOCK_QUESTION_IDS.L2_Q1]: 2, [MOCK_QUESTION_IDS.L2_Q2]: 1, [MOCK_QUESTION_IDS.L2_Q3]: 1,
  [MOCK_QUESTION_IDS.L3_Q1]: 1, [MOCK_QUESTION_IDS.L3_Q2]: 0, [MOCK_QUESTION_IDS.L3_Q3]: 1,
  [MOCK_QUESTION_IDS.L4_Q1]: 0, [MOCK_QUESTION_IDS.L4_Q2]: 2, [MOCK_QUESTION_IDS.L4_Q3]: 1,
  [MOCK_QUESTION_IDS.FR_Q1]: 2, [MOCK_QUESTION_IDS.FR_Q2]: 1, [MOCK_QUESTION_IDS.FR_Q3]: 0,
  [MOCK_QUESTION_IDS.FR_Q4]: 1, [MOCK_QUESTION_IDS.FR_Q5]: 2, [MOCK_QUESTION_IDS.FR_Q6]: 1,
};

// ═══════════════════════════════════════════════════════════════
// MOCK TREE STATE ACCUMULATOR — TODO: REMOVE BEFORE PRODUCTION
// Persists tree growth points across minigame sessions for mock
// data testing. Keyed by module ID. Clears on full page refresh.
// ═══════════════════════════════════════════════════════════════

interface MockTreeState {
  growth_points: number;
  current_stage: number;
  total_stages: number;
  points_per_stage: number;
  completed: boolean;
}

const mockTreeStateMap = new Map<string, MockTreeState>();

const getMockTreeStateForModule = (moduleId: string): MockTreeState => {
  const resolvedId = moduleId === 'mock-module-1' ? MOCK_MODULE_ID : moduleId;
  if (!mockTreeStateMap.has(resolvedId)) {
    mockTreeStateMap.set(resolvedId, {
      growth_points: 0,
      current_stage: 0,
      total_stages: 5,
      points_per_stage: 50,
      completed: false,
    });
  }
  return { ...mockTreeStateMap.get(resolvedId)! };
};

const updateMockTreeState = (moduleId: string, pointsToAdd: number): MockTreeState => {
  const resolvedId = moduleId === 'mock-module-1' ? MOCK_MODULE_ID : moduleId;
  const current = getMockTreeStateForModule(resolvedId);
  const maxPoints = current.total_stages * current.points_per_stage;
  const newPoints = Math.min(current.growth_points + pointsToAdd, maxPoints);
  const newStage = Math.min(
    Math.floor(newPoints / current.points_per_stage),
    current.total_stages
  );

  const updated: MockTreeState = {
    ...current,
    growth_points: newPoints,
    current_stage: newStage,
    completed: newPoints >= maxPoints,
  };
  mockTreeStateMap.set(resolvedId, updated);
  return { ...updated };
};

// ═══════════════════════════════════════════════════════════════
// PER-QUESTION POINT DEDUPLICATION — TODO: REMOVE BEFORE PRODUCTION
// Tracks which question IDs have already awarded base growth points.
// Each question can only award points once, ever (across all attempts).
// ═══════════════════════════════════════════════════════════════

export const mockAwardedQuestionIds = new Set<string>();

// ═══════════════════════════════════════════════════════════════
// MOCK GYN PLAYED TRACKER — TODO: REMOVE BEFORE PRODUCTION
// Tracks which lessons have had 3/3 correct (minigame completed).
// Exported so LessonView and growYourNestAPI can check it.
// Only set on perfect score (3/3), NOT on launch.
// ═══════════════════════════════════════════════════════════════

export const mockGYNPlayedLessons = new Set<string>();

// ═══════════════════════════════════════════════════════════════
// PUBLIC HELPERS
// ═══════════════════════════════════════════════════════════════

export const isMockModuleId = (moduleId: string): boolean =>
  moduleId.startsWith('mock-module-') || moduleId === MOCK_MODULE_ID;

export const isMockLessonId = (lessonId: string): boolean =>
  lessonId.startsWith('mock-lesson-') || MOCK_LESSON_IDS.includes(lessonId);

export const isMockQuestionId = (questionId: string): boolean =>
  questionId.startsWith('00000000-0000-4000-c');

export const getMockLessonsForModule = (_moduleId: string): any[] =>
  MOCK_LESSONS_DATA.map((lesson) => ({
    ...lesson,
    grow_your_nest_played: mockGYNPlayedLessons.has(lesson.id),
  }));

export const getMockQuizForLesson = (lessonId: string): any[] => {
  if (lessonId.startsWith('mock-lesson-')) {
    const index = parseInt(lessonId.replace('mock-lesson-', ''), 10) - 1;
    if (index >= 0 && index < MOCK_LESSON_IDS.length) {
      return MOCK_QUIZ_DATA[MOCK_LESSON_IDS[index]] || [];
    }
  }
  return MOCK_QUIZ_DATA[lessonId] || [];
};

export const getMockFreeRoamQuestions = (_moduleId: string): any => {
  const moduleId = _moduleId === 'mock-module-1' ? MOCK_MODULE_ID : _moduleId;
  const allLessonQuestions = MOCK_LESSON_IDS.flatMap((id) => MOCK_QUIZ_DATA[id] || []);
  const allQuestions = [...allLessonQuestions, ...MOCK_FREE_ROAM_EXTRA_QUESTIONS];
  const shuffled = [...allQuestions];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  // Return accumulated tree state instead of always-zero
  const treeState = getMockTreeStateForModule(moduleId);
  const remainder = treeState.growth_points % treeState.points_per_stage;
  return {
    questions: shuffled,
    tree_state: {
      ...treeState,
      points_to_next_stage: remainder === 0 && treeState.growth_points > 0
        ? treeState.points_per_stage
        : treeState.points_per_stage - remainder,
      points_to_complete: (treeState.total_stages * treeState.points_per_stage) - treeState.growth_points,
      completed_at: null,
    },
  };
};

export const getMockFreeRoamState = (_moduleId?: string) => {
  const moduleId = (_moduleId === 'mock-module-1' ? MOCK_MODULE_ID : _moduleId) || MOCK_MODULE_ID;
  const treeState = getMockTreeStateForModule(moduleId);
  const remainder = treeState.growth_points % treeState.points_per_stage;
  return {
    ...treeState,
    points_to_next_stage: remainder === 0 && treeState.growth_points > 0
      ? treeState.points_per_stage
      : treeState.points_per_stage - remainder,
    points_to_complete: (treeState.total_stages * treeState.points_per_stage) - treeState.growth_points,
    completed_at: treeState.completed ? new Date().toISOString() : null,
  };
};

export const validateMockAnswer = (questionId: string, answerId: string): { is_correct: boolean; explanation: string } => {
  const correctIndex = MOCK_CORRECT_ANSWERS[questionId];
  const allQuestions = [...Object.values(MOCK_QUIZ_DATA).flat(), ...MOCK_FREE_ROAM_EXTRA_QUESTIONS];
  const question = allQuestions.find((q) => q.id === questionId);
  if (!question) return { is_correct: false, explanation: 'Question not found in mock data.' };
  const correctAnswer = question.answers[correctIndex];
  return { is_correct: correctAnswer?.id === answerId, explanation: question.explanation || '' };
};

export const getMockGYNValidateAnswer = (questionId: string, answerId: string) => {
  const result = validateMockAnswer(questionId, answerId);
  // Include correct_answer_id so the UI can show which answer was correct
  const correctIndex = MOCK_CORRECT_ANSWERS[questionId];
  const allQuestions = [...Object.values(MOCK_QUIZ_DATA).flat(), ...MOCK_FREE_ROAM_EXTRA_QUESTIONS];
  const question = allQuestions.find((q) => q.id === questionId);
  const correctAnswerId = question?.answers[correctIndex]?.id ?? null;
  return { is_correct: result.is_correct, explanation: result.explanation, correct_answer_id: correctAnswerId };
};

export const getMockGYNLessonSubmit = (
  answers: { question_id: string; answer_id: string }[],
  lessonId?: string
) => {
  let correctCount = 0;
  let newPointsEarned = 0;

  answers.forEach(({ question_id, answer_id }) => {
    const isCorrect = validateMockAnswer(question_id, answer_id).is_correct;
    if (isCorrect) {
      correctCount++;
      // Only award base points if this question hasn't been awarded before
      if (!mockAwardedQuestionIds.has(question_id)) {
        mockAwardedQuestionIds.add(question_id);
        newPointsEarned += 10;
      }
    }
  });

  // Fertilizer bonus: only on 3/3 correct (full completion)
  const isPerfect = correctCount === answers.length && answers.length === 3;
  const fertilizerBonus = isPerfect ? 20 : 0;
  const totalPointsEarned = newPointsEarned + fertilizerBonus;

  // Mark lesson as GYN-played only on perfect score (3/3)
  if (isPerfect && lessonId) {
    mockGYNPlayedLessons.add(lessonId);
  }

  // Get previous state for transition info
  const prevState = getMockTreeStateForModule(MOCK_MODULE_ID);
  const previousStage = prevState.current_stage;

  // Accumulate into persistent mock state
  const newState = updateMockTreeState(MOCK_MODULE_ID, totalPointsEarned);
  const remainder = newState.growth_points % newState.points_per_stage;

  return {
    success: true,
    correct_count: correctCount,
    total_questions: answers.length,
    growth_points_earned: totalPointsEarned,
    fertilizer_bonus: isPerfect,
    coins_earned: newState.current_stage > previousStage ? (newState.current_stage - previousStage) * 50 : 0,
    tree_state: {
      growth_points: newState.growth_points,
      current_stage: newState.current_stage,
      total_stages: newState.total_stages,
      points_per_stage: newState.points_per_stage,
      points_to_next_stage: remainder === 0 && newState.growth_points > 0
        ? newState.points_per_stage
        : newState.points_per_stage - remainder,
      completed: newState.completed,
      previous_stage: previousStage,
      stage_increased: newState.current_stage > previousStage,
      just_completed: newState.completed && !prevState.completed,
    },
  };
};

export const getMockGYNFreeRoamAnswer = (
  questionId: string,
  answerId: string,
  consecutiveCorrect?: number
) => {
  const result = validateMockAnswer(questionId, answerId);

  let basePointsEarned = 0;
  let newConsecutive = consecutiveCorrect || 0;

  if (result.is_correct) {
    newConsecutive++;
    // Only award base points if this question hasn't been awarded before
    if (!mockAwardedQuestionIds.has(questionId)) {
      mockAwardedQuestionIds.add(questionId);
      basePointsEarned = 10;
    }
  } else {
    newConsecutive = 0;
  }

  // Fertilizer bonus: every 3 consecutive correct
  const isFertilizer = result.is_correct && newConsecutive > 0 && newConsecutive % 3 === 0;
  const fertilizerBonus = isFertilizer ? 20 : 0;
  const totalPointsEarned = basePointsEarned + fertilizerBonus;

  // Get previous state for transition info
  const prevState = getMockTreeStateForModule(MOCK_MODULE_ID);
  const previousStage = prevState.current_stage;

  // Accumulate into persistent mock state
  const newState = updateMockTreeState(MOCK_MODULE_ID, totalPointsEarned);
  const remainder = newState.growth_points % newState.points_per_stage;

  return {
    success: true,
    is_correct: result.is_correct,
    explanation: result.explanation,
    growth_points_earned: totalPointsEarned,
    fertilizer_bonus: isFertilizer,
    coins_earned: newState.current_stage > previousStage ? 50 : 0,
    tree_state: {
      growth_points: newState.growth_points,
      current_stage: newState.current_stage,
      total_stages: newState.total_stages,
      points_per_stage: newState.points_per_stage,
      points_to_next_stage: remainder === 0 && newState.growth_points > 0
        ? newState.points_per_stage
        : newState.points_per_stage - remainder,
      points_to_complete: (newState.total_stages * newState.points_per_stage) - newState.growth_points,
      completed: newState.completed,
      previous_stage: previousStage,
      stage_increased: newState.current_stage > previousStage,
      just_completed: newState.completed && !prevState.completed,
    },
  };
};