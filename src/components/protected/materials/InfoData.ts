export interface CalculatorInfo {
  title: string;
  description: string;
  howToUse: string[];
  howToUseTitle?: string; // Optional custom title for the "How to Use" section
  terms: {
    term: string;
    definition: string;
  }[];
}

export const calculatorInfoData: Record<string, CalculatorInfo> = {
  mortgage: {
    title: "Mortgage Calculator",
    description: "Calculate your estimated monthly mortgage payments and see how different factors affect your total costs.",
    howToUseTitle: "How to Use This Calculator",
    howToUse: [
      "Enter the home purchase price you're considering",
      "Input your down payment amount (typically 10-20% of home price)",
      "Set your loan term (15 or 30 years are most common)",
      "Enter the interest rate offered by your lender",
      "Add monthly property tax, home insurance, and PMI if applicable",
      "Review your monthly payment breakdown and total loan costs"
    ],
    terms: [
      {
        term: "Principal",
        definition: "The amount of money you borrow to purchase the home (home price minus down payment)."
      },
      {
        term: "Interest Rate",
        definition: "The annual percentage rate (APR) charged by the lender for borrowing money."
      },
      {
        term: "Down Payment",
        definition: "The upfront payment you make toward the purchase price, typically 3-20% of the home's value."
      },
      {
        term: "Loan Term",
        definition: "The length of time (in years) over which you'll repay the mortgage loan."
      },
      {
        term: "Property Tax",
        definition: "Annual taxes paid to local government based on your home's assessed value, usually paid monthly through escrow."
      },
      {
        term: "Home Insurance",
        definition: "Required insurance coverage that protects your home and belongings from damage or loss."
      },
      {
        term: "PMI (Private Mortgage Insurance)",
        definition: "Insurance required when your down payment is less than 20%, protecting the lender if you default."
      },
      {
        term: "Escrow",
        definition: "An account where your lender holds funds to pay property taxes and insurance on your behalf."
      }
    ]
  },
  
  "debt-to-income": {
    title: "Debt-to-Income Calculator",
    description: "Calculate your debt-to-income ratio to understand how much of your monthly income goes toward debt payments.",
    howToUseTitle: "How to Use This Calculator",
    howToUse: [
      "Enter your total gross monthly income (before taxes and deductions)",
      "Input your monthly housing payment (rent or mortgage including taxes/insurance)",
      "Add all monthly debt payments: credit cards, car loans, student loans",
      "Include other recurring debt payments like personal loans or alimony",
      "Review your DTI ratio and see how lenders typically view your ratio",
      "Use the insights to improve your borrowing power"
    ],
    terms: [
      {
        term: "Debt-to-Income Ratio (DTI)",
        definition: "The percentage of your monthly income that goes toward paying debts. Calculated as total monthly debt payments divided by gross monthly income."
      },
      {
        term: "Gross Monthly Income",
        definition: "Your total monthly income before taxes, insurance, and other deductions are taken out."
      },
      {
        term: "Front-End Ratio",
        definition: "The percentage of income that goes toward housing expenses only (mortgage, taxes, insurance)."
      },
      {
        term: "Back-End Ratio",
        definition: "The percentage of income that goes toward all monthly debt obligations including housing."
      },
      {
        term: "Housing Payment",
        definition: "Monthly mortgage payment including principal, interest, property taxes, and insurance (PITI)."
      },
      {
        term: "Minimum Payments",
        definition: "The lowest required monthly payment on credit cards and loans, as shown on your statements."
      },
      {
        term: "Qualified Mortgage (QM)",
        definition: "Most lenders prefer a DTI ratio of 43% or lower for qualified mortgages, though some may accept higher ratios."
      },
      {
        term: "Debt Obligations",
        definition: "Recurring monthly payments including credit cards, loans, alimony, child support, and other contractual payments."
      }
    ]
  },
  
  "credit-score": {
    title: "Credit Score Calculator",
    description: "Understand how different factors impact your credit score and estimate potential improvements.",
    howToUseTitle: "How to Use This Calculator",
    howToUse: [
      "Enter your current estimated credit score (check your credit report or banking app)",
      "Input details about your credit utilization (current balances vs. credit limits)",
      "Select your payment history record (on-time vs. missed payments)",
      "Enter the average age of your credit accounts",
      "Choose your credit mix (types of accounts you have)",
      "Review your score breakdown and improvement recommendations"
    ],
    terms: [
      {
        term: "Credit Score",
        definition: "A numerical representation (300-850) of your creditworthiness based on your credit history and current credit status."
      },
      {
        term: "Payment History (35%)",
        definition: "Your track record of making on-time payments. This is the most important factor in your credit score."
      },
      {
        term: "Credit Utilization (30%)",
        definition: "The percentage of available credit you're using. Lower utilization (under 30%, ideally under 10%) is better."
      },
      {
        term: "Credit History Length (15%)",
        definition: "How long you've had credit accounts open. Longer credit history generally improves your score."
      },
      {
        term: "Credit Mix (10%)",
        definition: "Having different types of credit accounts (credit cards, auto loans, mortgage) can positively impact your score."
      },
      {
        term: "New Credit Inquiries (10%)",
        definition: "Recent applications for new credit. Too many hard inquiries in a short period can lower your score."
      },
      {
        term: "Hard Inquiry",
        definition: "A credit check performed when you apply for credit, which can temporarily lower your score by a few points."
      },
      {
        term: "Credit Limit",
        definition: "The maximum amount you can borrow on a credit account, set by the lender based on your creditworthiness."
      },
      {
        term: "FICO Score",
        definition: "The most widely used credit scoring model, ranging from 300-850, created by the Fair Isaac Corporation."
      }
    ]
  },

  "first-time-buyer": {
    title: "First-Time Homebuyer Checklist",
    description: "A comprehensive step-by-step guide for first-time homebuyers covering all essential phases of the home buying process.",
    howToUseTitle: "How to Use This Checklist",
    howToUse: [
      "Start from the top and work through each category in order",
      "Check off items as you complete them to track your progress",
      "Use the progress bar to monitor your overall advancement",
      "Don't skip steps - each item is important for a successful purchase",
      "Consult with professionals (real estate agent, lender, lawyer) when needed",
      "Keep all documentation organized throughout the process"
    ],
    terms: [
      {
        term: "Credit Score",
        definition: "A number between 300-850 that represents your creditworthiness. Higher scores typically qualify for better mortgage rates."
      },
      {
        term: "Pre-approval",
        definition: "A lender's conditional commitment to loan you money up to a certain amount based on your financial situation."
      },
      {
        term: "Down Payment",
        definition: "The upfront cash payment you make toward the purchase price, typically 3-20% of the home's value."
      },
      {
        term: "Closing Costs",
        definition: "Fees and expenses paid at closing, typically 2-5% of the home price, including appraisal, title insurance, and attorney fees."
      },
      {
        term: "Home Inspection",
        definition: "A thorough examination of a home's condition by a qualified inspector to identify potential issues."
      },
      {
        term: "Contingency",
        definition: "Conditions in your offer that must be met for the sale to proceed, such as inspection or financing contingencies."
      },
      {
        term: "Earnest Money",
        definition: "A deposit showing your serious intent to purchase, typically 1-2% of the purchase price."
      },
      {
        term: "Title Search",
        definition: "A review of public records to verify the seller's legal ownership and identify any liens or encumbrances."
      },
      {
        term: "Escrow",
        definition: "A neutral third party that holds funds and documents until all conditions of the sale are met."
      },
      {
        term: "Walk-through",
        definition: "A final inspection of the property typically conducted 24 hours before closing to ensure nothing has changed."
      }
    ]
  },

  "home-inspection": {
    title: "Home Inspection Checklist",
    description: "A detailed checklist to help you systematically inspect a home and identify potential issues before purchase.",
    howToUseTitle: "How to Use This Checklist",
    howToUse: [
      "Use this checklist during your professional home inspection or when viewing homes",
      "Check off items as you examine each area of the property",
      "Take notes about any issues, concerns, or questions you have",
      "Pay special attention to high-priority items as they could be costly to fix",
      "Use your notes to negotiate repairs or price adjustments with the seller",
      "Keep detailed records for all homes you're considering"
    ],
    terms: [
      {
        term: "HVAC",
        definition: "Heating, Ventilation, and Air Conditioning system that controls indoor climate and air quality."
      },
      {
        term: "Foundation",
        definition: "The structural base of the home, typically made of concrete, that supports the entire structure."
      },
      {
        term: "Load-bearing Wall",
        definition: "A wall that supports the weight of the structure above it and cannot be removed without structural modifications."
      },
      {
        term: "Electrical Panel",
        definition: "The main distribution point for electrical circuits throughout the home, also called a breaker box."
      },
      {
        term: "Plumbing Stack",
        definition: "A vertical pipe that carries wastewater from upper floors to the sewer line or septic system."
      },
      {
        term: "Insulation R-Value",
        definition: "A measure of insulation's resistance to heat flow - higher values indicate better insulating properties."
      },
      {
        term: "GFCI Outlet",
        definition: "Ground Fault Circuit Interrupter outlet that shuts off power when it detects electrical irregularities, required in bathrooms and kitchens."
      },
      {
        term: "Flashing",
        definition: "Waterproof material installed around roof penetrations like chimneys and vents to prevent water infiltration."
      },
      {
        term: "Settlement Cracks",
        definition: "Cracks in walls or foundation caused by the natural settling of a home, usually minor unless they're large or growing."
      },
      {
        term: "Grading",
        definition: "The slope of land around your home that should direct water away from the foundation."
      }
    ]
  }
};