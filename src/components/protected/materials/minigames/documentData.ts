export type DocumentType = 'purchase-agreement' | 'home-inspection' | 'mortgage-pre-approval' | 'closing-disclosure';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export const documentContent: Record<DocumentType, Record<DifficultyLevel, Array<{ content: string; quality: number; issues: string[]; highlights: string[] }>>> = {
  'purchase-agreement': {
    easy: [
      {
        content: 'Purchase Agreement\n\nProperty Address: 123 Main St, City, State, ZIP\nPurchase Price: $350,000\nEarnest Money Deposit: $5,000\n\nContingencies:\n- Financing Contingency: Buyer to obtain financing\n- Inspection Contingency: Buyer may inspect property\n- Appraisal: Property value to be determined\n\nClosing Date: Approximately 60 days\nPossession: Upon closing\n\nInclusions: All fixtures and appliances\nExclusions: Personal items\n\nDisclosures: As required by law\n\nSignatures:\nBuyer: _________________ Date: _______\nSeller: _________________ Date: _______\n\nBoth parties agree to the terms stated above.',
        quality: 42,
        issues: ['No specific contingency deadlines', 'Vague appraisal terms', 'No earnest money percentage specified', 'Missing specific possession time'],
        highlights: ['Financing Contingency: Buyer to obtain financing', 'Approximately 60 days', 'Deposit: $5,000']
      },
      {
        content: 'Purchase Agreement\n\nProperty Address: 123 Main St, City, State, ZIP\nPurchase Price: $350,000\nEarnest Money Deposit: $10,000 (3% of purchase price)\n\nContingencies:\n- Financing Contingency: 30 days from acceptance\n- Inspection Contingency: 17 days from acceptance\n- Appraisal Contingency: Property must appraise at or above purchase price\n- Title Contingency: Clear title required\n\nClosing Date: Within 45 days of acceptance\nPossession: Day of closing at 5:00 PM\n\nInclusions: All fixtures, appliances, window coverings\nExclusions: Family heirloom chandelier in dining room\n\nSeller Disclosure: Attached and acknowledged\nLead Paint Disclosure: Attached (if built before 1978)\n\nSignatures:\nBuyer: _________________ Date: _______\nSeller: _________________ Date: _______\n\nAll contingencies have specific deadlines and clear terms.',
        quality: 98,
        issues: [],
        highlights: ['Financing Contingency: 30 days from acceptance', 'Inspection Contingency: 17 days', 'Appraisal Contingency: Property must appraise at or above purchase price', 'Earnest Money: $10,000 (3%)']
      }
    ],
    medium: [],
    hard: []
  },
  'home-inspection': {
    easy: [
      {
        content: 'Home Inspection Report\n\nProperty: 555 Maple Drive, [Full Address]\nInspection Date: [Date]\nInspector: John Smith\n\nSUMMARY:\nGeneral condition: Acceptable\nItems needing attention: Several\n\nROOFING:\n- Condition: Some shingles appear loose\n- Action: Repairs recommended\n\nFOUNDATION:\n- Condition: Minor cracks observed\n- Action: Monitor and seal as needed\n\nELECTRICAL:\n- Condition: System operational\n- Action: Standard maintenance\n\nPLUMBING:\n- Condition: Functioning properly\n- Action: Regular upkeep recommended\n\nHVAC:\n- Condition: Systems working\n- Action: Continue routine servicing\n\nOTHER SYSTEMS:\n- Windows, doors, insulation inspected\n- General wear consistent with age\n\nConclusion: Property is in livable condition with normal maintenance needs.',
        quality: 38,
        issues: ['No specific measurements or locations', 'Missing cost estimates', 'No safety issue identification', 'Vague recommendations without timeline'],
        highlights: ['Some shingles appear loose', 'Minor cracks observed', 'Systems working']
      },
      {
        content: 'Home Inspection Report\n\nProperty: 555 Maple Drive, [Full Address]\nInspection Date: [Date]\nInspector: John Smith, Certified #12345\n\nEXECUTIVE SUMMARY:\nMajor Concerns: 2 items requiring immediate attention\nSafety Issues: 1 item\nMaintenance Items: 8 items\n\nROOFING SYSTEM:\n- Age: Approximately 18 years (25-year rated shingles)\n- Condition: 15-20 shingles loose/missing on south slope\n- Recommendation: Repair within 6 months; budget for replacement in 3-5 years\n- Estimated Cost: $800-1,200 for repairs\n\nFOUNDATION:\n- Material: Poured concrete\n- Observed: Hairline cracks in northeast corner (1/16" width, 3 feet long)\n- Assessment: Typical settling, monitor for expansion\n- Recommendation: Seal cracks, install monitoring markers\n- Estimated Cost: $300-500\n\nELECTRICAL SYSTEM:\n- Service: 200-amp panel, adequate for home size\n- Condition: Good overall\n- Minor Issue: 2 GFCI outlets in bathrooms not functioning\n- Recommendation: Replace GFCI outlets ($150-200)\n\nPLUMBING:\n- Supply: Copper lines, good condition\n- Drains: PVC, functioning properly\n- Water Heater: 8 years old, 40-gallon, maintenance current\n\nHVAC:\n- Heating: Forced air gas furnace, 12 years old\n- Cooling: Central AC, 10 years old\n- Condition: Both operational, recommend annual servicing\n\nAll photos and detailed findings attached.\nThis inspection meets ASHI standards.',
        quality: 96,
        issues: [],
        highlights: ['Major Concerns: 2 items requiring immediate attention', 'Estimated Cost: $800-1,200 for repairs', 'Specific measurements and locations provided', 'ASHI standards compliance']
      }
    ],
    medium: [],
    hard: []
  },
  'mortgage-pre-approval': {
    easy: [
      {
        content: 'MORTGAGE PRE-APPROVAL LETTER\n\nDate: [Current Date]\n\nTO: Sellers and Listing Agents\nRE: Mortgage Pre-Approval for [Buyer Name]\n\nThis letter confirms that [Buyer Name] has been pre-approved for a mortgage loan with the following details:\n\nLoan Amount: Up to $400,000\nLoan Type: Conventional mortgage\nInterest Rate: Current market rates apply\nDown Payment: Standard amount required\nDebt-to-Income Ratio: Acceptable\n\nDOCUMENTATION REVIEWED:\n- Employment and income verified\n- Assets reviewed\n- Credit report obtained\n- Debt obligations considered\n\nCONDITIONS:\n- Subject to property appraisal\n- Subject to continued employment\n- Subject to no material changes in financial status\n\nVALIDITY: This pre-approval is valid for 90 days.\n\nBuyer has been qualified for the stated loan amount.\n\nLender: Quick Loan Company\nPhone: (555) 123-4567\n\nSincerely,\nLoan Officer Name',
        quality: 35,
        issues: ['No specific interest rate provided', 'No NMLS license numbers', 'Missing specific down payment amount', 'No credit score disclosed'],
        highlights: ['Current market rates apply', 'Standard amount required', 'Documentation reviewed']
      },
      {
        content: 'MORTGAGE PRE-APPROVAL LETTER\n\nDate: [Current Date]\n\nTO: Sellers and Listing Agents\nRE: Mortgage Pre-Approval for [Buyer Full Name]\n\nThis letter certifies that [Buyer Name] has been pre-approved for a mortgage loan with the following terms:\n\nLoan Amount: Up to $400,000\nLoan Type: Conventional 30-year fixed-rate mortgage\nEstimated Interest Rate: 6.75% (subject to market conditions at lock)\nDown Payment: 20% ($80,000) verified and documented\nDebt-to-Income Ratio: 32% (within excellent range)\n\nDOCUMENTATION VERIFIED:\n✓ Employment and income (W-2s, pay stubs, tax returns)\n✓ Assets and down payment funds (bank statements)\n✓ Credit report (score: 760)\n✓ Debt obligations (student loans, auto loans)\n\nCONDITIONS:\n- Pre-approval based on property appraisal meeting purchase price\n- Property must meet lending standards\n- No material changes to buyer\'s financial situation\n\nVALIDITY: This pre-approval is valid for 90 days from the date above. Interest rate must be locked at time of purchase contract.\n\nBuyer is financially qualified and has demonstrated ability to close on a property up to $400,000.\n\nUnderwriter: Jennifer Martinez, NMLS #123456\nLender: Premier Mortgage Company\nLicense: State Mortgage License #789012\nPhone: (555) 123-4567\n\nSincerely,\nLoan Officer Name\nNMLS #654321',
        quality: 97,
        issues: [],
        highlights: ['Estimated Interest Rate: 6.75%', 'Down Payment: 20% ($80,000) verified and documented', 'Credit score: 760', 'NMLS license numbers provided']
      }
    ],
    medium: [],
    hard: []
  },
  'closing-disclosure': {
    easy: [
      {
        content: 'CLOSING DISCLOSURE\n\nIssued: [Date]\n\nBORROWER: [Name and Address]\nSELLER: [Name and Address]\nLENDER: [Lender Name and Address]\n\nPROPERTY: [Full Address]\nSALE PRICE: $400,000\n\nLOAN TERMS:\nLoan Amount: $320,000\nInterest Rate: 6.5%\nMonthly Principal & Interest: $2,023\nLoan Term: 30 years (360 payments)\nPrepayment Penalty: NO\nBalloon Payment: NO\n\nMONTHLY PAYMENTS:\nEstimated Total: $2,423/month\n- Principal & Interest: $2,023\n- Estimated Escrow: $400/month\n\nCLOSING COSTS:\nOrigination Charges: $2,100\nServices You Cannot Shop For: $800\nServices You Did Shop For: $3,050\nTaxes & Government Fees: $850\nPrepaids: $2,594\nInitial Escrow: $1,500\nOther: $600\n\nTOTAL CLOSING COSTS: $11,494\n\nCASH TO CLOSE:\nDown Payment: $80,000\nClosing Costs: $11,494\nSeller Credit: -$3,000\nTotal: $88,494\n\nBorrower Signature: _________________ Date: _______',
        quality: 32,
        issues: ['Missing APR disclosure', 'No comparison to Loan Estimate', 'Missing TRID 3-day requirement notice', 'No interest rate rise disclosure'],
        highlights: ['Total: $88,494', 'Closing Costs: $11,494', 'Interest Rate: 6.5%']
      },
      {
        content: 'CLOSING DISCLOSURE (CD)\n\nIssued: [Date - Must be 3 business days before closing per TRID]\n\nBORROWER: [Name and Address]\nSELLER: [Name and Address]\nLENDER: [Lender Name, Address, NMLS#]\n\nPROPERTY: [Full Address]\nSALE PRICE: $400,000\n\nLOAN TERMS:\nLoan Amount: $320,000\nInterest Rate: 6.5% (FIXED for entire loan term)\nAPR: 6.72%\nMonthly Principal & Interest: $2,023\nLoan Term: 30 years (360 monthly payments)\nPrepayment Penalty: NO\nBalloon Payment: NO\n\nCan your interest rate rise? NO\nCan your monthly payment rise? YES (Taxes and insurance can increase)\n\nPROJECTED PAYMENTS:\nYears 1-7: $2,423/month\n- Principal & Interest: $2,023\n- Mortgage Insurance: $0\n- Estimated Escrow: $400/month\n\nCLOSING COSTS ITEMIZED:\nSection A - Origination Charges: $2,100\nSection B - Services Borrower Did Not Shop For: $800\nSection C - Services Borrower Did Shop For: $3,050\nSection E - Taxes & Government Fees: $850\nSection F - Prepaids: $2,594\nSection G - Initial Escrow Payment: $1,500\nSection H - Other: $600\n\nTOTAL CLOSING COSTS: $11,494\n\nCASH TO CLOSE:\nDown Payment (20%): $80,000\nClosing Costs: $11,494\nSeller Credit: -$3,000\nTotal Cash to Close: $88,494\n\nCOMPARISON TO LOAN ESTIMATE:\n- Loan Estimate Closing Costs: $11,150\n- Final Closing Costs: $11,494\n- Difference: +$344 (within 10% tolerance)\n\nThis document meets all TILA-RESPA Integrated Disclosure (TRID) requirements.\n\nBorrower Signature: _________________ Date: _______',
        quality: 98,
        issues: [],
        highlights: ['3 business days before closing per TRID', 'APR: 6.72%', 'COMPARISON TO LOAN ESTIMATE: Difference +$344 (within 10% tolerance)', 'Meets all TRID requirements']
      }
    ],
    medium: [],
    hard: []
  }
};