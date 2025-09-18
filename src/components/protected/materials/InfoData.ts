export interface CalculatorInfo {
  title: string;
  description: string;
  howToUse: string[];
  terms: {
    term: string;
    definition: string;
  }[];
}

export const calculatorInfoData: Record<string, CalculatorInfo> = {
  mortgage: {
    title: "Mortgage Calculator",
    description: "Calculate your estimated monthly mortgage payments and see how different factors affect your total costs.",
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
  }
};