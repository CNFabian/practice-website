export type DocumentType = 'purchase-agreement' | 'home-inspection' | 'mortgage-pre-approval' | 'closing-disclosure';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export const documentContent: Record<DocumentType, Record<DifficultyLevel, Array<{ content: string; quality: number; issues: string[]; highlights: string[] }>>> = {
  'purchase-agreement': {
    easy: [
      {
        content: 'Purchase Agreement\n\nProperty: 123 Main St\nPrice: $350,000\nDeposit: $5,000\n\nContingencies:\n- Financing: Buyer to obtain financing\n- Inspection: Buyer may inspect\n\nClosing: Approximately 60 days\n\nSignatures:\nBuyer: _________ Date: _____\nSeller: _________ Date: _____',
        quality: 42,
        issues: ['No specific contingency deadlines', 'Vague terms', 'Missing possession details'],
        highlights: ['Financing: Buyer to obtain', 'Approximately 60 days', 'Deposit: $5,000']
      },
      {
        content: 'Purchase Agreement\n\nProperty: 123 Main St\nPrice: $350,000\nDeposit: $10,000 (3%)\n\nContingencies:\n- Financing: 30 days from acceptance\n- Inspection: 17 days from acceptance\n- Appraisal: Must meet or exceed price\n\nClosing: 45 days from acceptance\nPossession: Day of closing, 5:00 PM\n\nSignatures:\nBuyer: _________ Date: _____\nSeller: _________ Date: _____',
        quality: 98,
        issues: [],
        highlights: ['Financing: 30 days', 'Inspection: 17 days', 'Appraisal: Must meet or exceed', 'Deposit: $10,000 (3%)']
      }
    ],
    medium: [
      {
        content: 'Purchase Agreement\n\nProperty: 456 Oak Avenue, City, State, ZIP\nPurchase Price: $425,000\nEarnest Money: $12,000 (2.8%)\n\nContingencies:\n- Financing: 25 days from acceptance\n- Inspection: 14 days from acceptance\n- Appraisal: Property must appraise at purchase price\n- Sale of Buyer\'s Property: Must sell within 60 days\n- Title: Review to be completed\n\nClosing: Within 60 days of acceptance\nPossession: Day of closing\n\nInclusions: Fixtures, appliances, window coverings\nExclusions: Washer, dryer, storage shed\n\nHome Warranty: To be negotiated\n\nSignatures:\nBuyer: _________ Date: _____\nSeller: _________ Date: _____',
        quality: 64,
        issues: ['Sale contingency adds risk', 'No specific possession time', 'Shorter inspection period', 'Appraisal wording imprecise'],
        highlights: ['Financing: 25 days', 'Inspection: 14 days', 'Sale contingency included', 'Deposit: $12,000 (2.8%)']
      },
      {
        content: 'Purchase Agreement\n\nProperty: 456 Oak Avenue, City, State, ZIP\nPurchase Price: $425,000\nEarnest Money: $12,750 (3%)\n\nContingencies:\n- Financing: 30 days from acceptance\n- Inspection: 17 days from acceptance\n- Appraisal: Property must appraise at or above purchase price\n- Title: Clear title within 21 days\n\nClosing: Within 45 days or 5 days after contingencies removed\nPossession: Day of closing at 6:00 PM\n\nInclusions: Fixtures, appliances, window coverings, washer, dryer\nExclusions: Outdoor shed\n\nHome Warranty: 1-year warranty included\n\nSignatures:\nBuyer: _________ Date: _____\nSeller: _________ Date: _____',
        quality: 92,
        issues: [],
        highlights: ['Standard periods (30/17 days)', 'Appraisal at or above', 'Specific possession: 6:00 PM', 'Warranty included']
      }
    ],
    hard: [
      {
        content: 'Purchase Agreement\n\nProperty: 789 Pine Street, City, State, ZIP\nPurchase Price: $515,000\nEarnest Money: $15,000 (2.9%)\n\nContingencies:\n- Financing: 30 days from acceptance\n- Inspection: 17 days from acceptance\n- Appraisal: Property value to be assessed\n- HOA Review: 7 days for documents\n\nClosing: Within 45 days of acceptance\nPossession: Day of closing at 5:00 PM\n\nInclusions: Fixtures, appliances, window coverings, ceiling fans\nExclusions: Master bedroom chandelier, outdoor grill\n\nHOA Fees: $285/month\nHOA Documents: To be provided\n\nAs-Is Clause: Property sold in current condition\nRepairs: Seller will not make repairs\nHome Warranty: Not included\n\nSignatures:\nBuyer: _________ Date: _____\nSeller: _________ Date: _____',
        quality: 71,
        issues: ['As-Is clause limits protection', 'Appraisal wording vague', 'Short HOA review (7 vs 10-14 days)', 'Missing Title Contingency'],
        highlights: ['Financing: 30 days', 'HOA Review: 7 days', 'As-Is Clause included', 'HOA: $285/month']
      },
      {
        content: 'Purchase Agreement\n\nProperty: 789 Pine Street, City, State, ZIP\nPurchase Price: $515,000\nEarnest Money: $15,450 (3%)\n  - Initial: $5,000 within 3 days\n  - Additional: $10,450 upon inspection removal\n\nContingencies:\n- Financing: 30 days from acceptance\n- Inspection: 17 days from acceptance\n- Appraisal: Property must appraise at or above purchase price\n- Title: Clear title within 21 days\n- HOA Review: 10 days for documents and financials\n\nClosing: Within 45 days or 5 days after contingencies removed\nPossession: Day of closing at 6:00 PM\n\nInclusions: Fixtures, appliances, window coverings, ceiling fans, master bedroom chandelier\nExclusions: None\n\nHOA Fees: $285/month\nHOA Documents: CC&Rs, bylaws, financials, meeting minutes provided\n\nRight to Request Repairs: Buyer may request based on inspection\nHome Warranty: Not included\n\nSignatures:\nBuyer: _________ Date: _____\nSeller: _________ Date: _____',
        quality: 95,
        issues: [],
        highlights: ['Appraisal at or above specified', 'HOA Review: 10 days with financials', 'Right to Request Repairs', 'Earnest money split into two deposits']
      }
    ]
  },
  'home-inspection': {
    easy: [
      {
        content: 'Home Inspection Report\n\nProperty: 555 Maple Drive\nInspector: John Smith\n\nSUMMARY:\nCondition: Acceptable with items needing attention\n\nROOFING: Some shingles loose - repairs recommended\nFOUNDATION: Minor cracks - monitor and seal\nELECTRICAL: Operational - standard maintenance\n\nConclusion: Livable condition with normal maintenance needs.',
        quality: 38,
        issues: ['No measurements', 'Missing cost estimates', 'No safety issues identified'],
        highlights: ['Shingles loose', 'Minor cracks', 'Systems operational']
      },
      {
        content: 'Home Inspection Report\n\nProperty: 555 Maple Drive\nInspector: John Smith, #12345\n\nSUMMARY:\nMajor Concerns: 2 items requiring immediate attention\nSafety Issues: 1 item\n\nROOFING:\n- 15-20 shingles loose on south slope\n- Repair within 6 months ($800-1,200)\n\nFOUNDATION:\n- Hairline cracks, northeast corner (1/16" wide, 3 feet long)\n- Seal cracks and monitor ($300-500)\n\nELECTRICAL:\n- 2 GFCI outlets in bathrooms not functioning\n- Replace outlets ($150-200)\n\nAll photos attached. Meets ASHI standards.',
        quality: 96,
        issues: [],
        highlights: ['Major Concerns: 2 items', 'Cost: $800-1,200', 'Specific measurements', 'ASHI compliant']
      }
    ],
    medium: [
      {
        content: 'Home Inspection Report\n\nProperty: 822 Birch Lane\nInspector: Sarah Johnson, #67890\nProperty Age: 25 years\n\nSUMMARY:\nMajor Concerns: 1 item\nMaintenance Items: 6 items\n\nROOFING:\n- Age: 12 years (asphalt shingles)\n- Moderate wear with granule loss\n- Budget for replacement in 5-7 years\n\nFOUNDATION:\n- Minor settling cracks (typical for age)\n- Seal and monitor\n\nELECTRICAL:\n- 150-amp panel\n- Several outlets not grounded\n- Upgrade outlets for safety\n\nPLUMBING:\n- Galvanized pipes showing wear\n- Water Heater: 14 years old, nearing end of lifespan\n- Monitor supply lines for corrosion\n\nHVAC:\n- Heating: 16 years old, functional\n- Cooling: 14 years old, operational\n- Plan for replacement within 3-5 years\n\nPhotos available upon request.',
        quality: 68,
        issues: ['Missing measurements', 'No cost estimates', 'Water heater concern not urgent', 'Photos not attached'],
        highlights: ['Replacement in 5-7 years', 'Settling cracks', 'Upgrade outlets']
      },
      {
        content: 'Home Inspection Report\n\nProperty: 822 Birch Lane\nInspector: Sarah Johnson, #67890, ASHI Member\nProperty Age: 25 years\n\nSUMMARY:\nMajor Concerns: 1 item (within 6 months)\nSafety Issues: 1 item\nMaintenance Items: 6 items\n\nROOFING:\n- Age: 12 years (20-25 year rated shingles)\n- Moderate granule loss on south slope\n- Budget $8,000-12,000 for replacement in 5-7 years\n\nFOUNDATION:\n- Hairline cracks (1/8" max) in two locations\n- Typical settlement\n- Seal cracks ($200-400), monitor annually\n\nELECTRICAL:\n- 150-amp panel adequate\n- Safety Issue: 8 outlets lack grounding\n- Upgrade to grounded outlets ($400-800)\n- Priority for kitchen/bath\n\nPLUMBING:\n- Galvanized pipes (40+ years) showing corrosion\n- Water Heater: 14 years old - RECOMMEND REPLACEMENT SOON\n- Cost: $1,200-1,800 for water heater\n\nHVAC:\n- Gas furnace: 16 years old, functional\n- Central AC: 14 years old, adequate\n- Budget $4,000-7,000 for replacement in 3-5 years\n\n115 photos attached. ASHI compliant.',
        quality: 94,
        issues: [],
        highlights: ['Specific measurements', 'Detailed cost estimates', 'Water heater flagged urgent', '115 photos attached']
      }
    ],
    hard: [
      {
        content: 'Home Inspection Report\n\nProperty: 1244 Cedar Court\nInspector: Michael Chen, #54321\nProperty Age: 18 years\n\nSUMMARY:\nMajor Concerns: 2 items\nSafety Issues: 1 item\nMaintenance Items: 9 items\n\nROOFING:\n- Age: 22 years (30-year architectural shingles)\n- Age-appropriate wear with curling\n- Flashing gaps around chimney\n- Repair flashing ($600-900)\n- Curling on south-facing slope\n\nFOUNDATION:\n- Poured concrete with brick veneer\n- Stepped cracking in brick (northwest corner)\n- Possible foundation movement\n- Structural engineer evaluation recommended\n- Diagonal crack pattern suggests settlement\n\nELECTRICAL:\n- 200-amp panel, adequate\n- One garage outlet has reverse polarity\n- Correct wiring ($75-150)\n\nPLUMBING:\n- Copper lines throughout\n- Water Heater: 6 years old, maintained\n- Sump Pump operational\n- Water Pressure: 65 PSI (normal)\n\nHVAC:\n- Gas furnace: 8 years old\n- Heat pump: 8 years old\n- Both functional and maintained\n- Continue annual servicing\n\nATTIC:\n- R-38 insulation\n- Adequate ventilation\n- No moisture issues\n\nINTERIOR:\n- Windows: Double-pane, good condition\n- Grading: Proper slope from foundation\n\n89 photos included. ASHI standards.',
        quality: 77,
        issues: ['Foundation needs engineer but no cost estimate', 'No radon/mold testing mentioned', 'Flashing severity not quantified', 'Missing crawl space details'],
        highlights: ['Engineer evaluation recommended', 'Flashing: $600-900', '89 photos']
      },
      {
        content: 'Home Inspection Report\n\nProperty: 1244 Cedar Court\nInspector: Michael Chen, #54321, InterNACHI Member\nProperty Age: 18 years\nInspection Time: 4.5 hours\n\nSUMMARY:\nMajor Concerns: 2 items requiring professional evaluation\nSafety Issues: 1 item (non-urgent)\nMaintenance Items: 9 items\n\nROOFING:\n- Age: 22 years (30-year rated, expires 2028)\n- Moderate curling on 15-20% of shingles\n- Flashing gaps: 1/4" to 1/2" around chimney (north/west sides)\n- Water intrusion potential\n- Repair flashing immediately ($600-900)\n- Plan roof replacement in 3-5 years ($9,000-14,000)\n\nFOUNDATION:\n- Poured concrete (8" walls) with brick veneer\n- Stepped cracking in brick (northwest corner, 6 feet long, 1/4" max width)\n- Pattern suggests possible settlement or movement\n- IMMEDIATE structural engineer evaluation before closing\n- Engineer cost: $300-500 (repairs TBD based on findings)\n\nELECTRICAL:\n- 200-amp panel (2015), code-compliant\n- Minor Issue: Garage outlet reverse polarity (hot/neutral reversed)\n- Licensed electrician to correct ($75-150)\n\nPLUMBING:\n- Type L copper lines (excellent condition)\n- Schedule 40 PVC drains, no issues\n- Water Heater: 6 years old, 50-gallon electric, maintained\n- Sump Pump: 3 years old, tested operational, battery backup present\n\nHVAC:\n- 96% efficiency gas furnace, 8 years old, maintained\n- 16 SEER heat pump, 8 years old, adequate\n- Both show excellent maintenance\n- Expected lifespan: 7-12 years with proper care\n\nATTIC:\n- R-38 blown-in fiberglass (exceeds code)\n- Ridge + soffit vents (1:300 ratio, compliant)\n- No moisture, mold, or condensation\n- Trusses in good condition\n\nADDITIONAL TESTING RECOMMENDED:\n- Radon testing ($150-300)\n- Mold inspection ($300-600) if air quality concerns\n\n127 high-resolution photos with annotations\nThermal imaging of exterior walls\nMeets ASHI, InterNACHI, and state standards',
        quality: 97,
        issues: [],
        highlights: ['IMMEDIATE engineer evaluation ($300-500)', 'Specific measurements: gaps 1/4"-1/2", cracks 6 feet', 'Radon/mold testing recommended', '127 photos with thermal imaging']
      }
    ]
  },
  'mortgage-pre-approval': {
    easy: [
      {
        content: 'MORTGAGE PRE-APPROVAL\n\nBuyer: [Name]\n\nLoan Amount: Up to $400,000\nLoan Type: Conventional 30-year\nInterest Rate: Current market rates\n\nDocumentation reviewed:\n- Employment verified\n- Assets reviewed\n- Credit obtained\n\nValid for 90 days.\n\nLender: Quick Loan Company\nLoan Officer Name',
        quality: 35,
        issues: ['No specific rate', 'No NMLS numbers', 'No down payment amount', 'No credit score'],
        highlights: ['Current market rates', 'Standard required', 'Documentation reviewed']
      },
      {
        content: 'MORTGAGE PRE-APPROVAL LETTER\n\nDate: [Current Date]\nBuyer: [Full Name]\n\nLoan Amount: Up to $400,000\nLoan Type: Conventional 30-year fixed\nInterest Rate: 6.75%\nDown Payment: 20% ($80,000) verified\nCredit Score: 760\nDebt-to-Income: 32%\n\nDocumentation Verified:\n✓ Employment (W-2s, pay stubs, tax returns)\n✓ Down payment funds (bank statements)\n✓ Credit report\n✓ Debt obligations\n\nValid for 90 days.\n\nLoan Officer: [Name], NMLS #654321\nLender: Premier Mortgage, NMLS #123456',
        quality: 97,
        issues: [],
        highlights: ['Rate: 6.75%', 'Down Payment: 20% verified', 'Credit: 760', 'NMLS numbers provided']
      }
    ],
    medium: [
      {
        content: 'MORTGAGE PRE-APPROVAL LETTER\n\nDate: [Current Date]\nBuyer: [Full Name]\n\nLoan Amount: Up to $475,000\nLoan Type: Conventional 30-year fixed\nInterest Rate: 6.5% (rate subject to change)\nDown Payment: 15% ($71,250) available\nDebt-to-Income: 38%\n\nDocumentation Reviewed:\n✓ Income verification\n✓ Employment history\n✓ Bank statements\n✓ Credit report pulled\n✓ Asset documentation\n\nConditions:\n- Property appraisal required\n- Final underwriting approval needed\n- Continued employment required\n- Property must meet lending standards\n\nValidity: 60 days from letter date\n\nLender: Hometown Mortgage Inc.\nCompany NMLS #987654\nLoan Officer Name',
        quality: 66,
        issues: ['DTI at 38% is borderline', 'Shorter validity (60 vs 90 days)', 'Only 15% down payment', 'No loan officer NMLS'],
        highlights: ['Rate subject to change', 'Down Payment: 15%', 'DTI: 38%', '60-day validity']
      },
      {
        content: 'MORTGAGE PRE-APPROVAL LETTER\n\nDate: [Current Date]\nBuyer: [Full Name]\n\nLoan Amount: Up to $475,000\nLoan Type: Conventional 30-year fixed\nInterest Rate: 6.5% (60-day lock upon contract)\nDown Payment: 20% ($95,000) verified and documented\nDebt-to-Income: 30% (excellent)\nCredit Score: 755\n\nDocumentation Fully Verified:\n✓ Employment and income (2 years W-2s, pay stubs, tax returns)\n✓ Down payment funds sourced and verified\n✓ Credit report\n✓ All debt obligations reviewed\n\nConditions:\n- Property must appraise at or above purchase price\n- Property must meet conventional lending standards\n- Continued employment verification\n- Final title review\n\nValidity: 90 days from date above\nRate Lock: 60-day lock available upon contract\n\nBuyer fully underwritten and qualified.\n\nLoan Officer: Susan Williams, NMLS #445566\nLender: Hometown Mortgage Inc., NMLS #987654',
        quality: 95,
        issues: [],
        highlights: ['20% down verified', 'DTI: 30% (excellent)', '60-day rate lock', 'Both NMLS numbers provided']
      }
    ],
    hard: [
      {
        content: 'MORTGAGE PRE-APPROVAL LETTER\n\nDate: [Current Date]\nBuyer: [Full Name]\n\nLoan Amount: Up to $550,000\nLoan Type: Conventional 30-year fixed\nInterest Rate: 6.25% estimated (subject to market)\nDown Payment: 18% ($99,000) reviewed\nDebt-to-Income: 41%\nCredit Score: 720\nMonthly Payment: $3,383 estimated (P&I)\n\nDocumentation:\n✓ Employment verified (2 years)\n✓ Income documentation reviewed\n✓ Bank statements provided\n✓ Credit report obtained\n✓ Current debts assessed\n✓ Asset verification completed\n\nConditions:\n- Satisfactory property appraisal\n- Final underwriting approval\n- Employment verification at closing\n- No new credit obligations\n- Property meets lending guidelines\n- Clear title required\n\nValidity: 90 days from date\n\nBuyer demonstrates qualification subject to final underwriting.\n\nUnderwriter: Thomas Anderson\nLoan Officer: Maria Rodriguez, NMLS #334455\nLender: First National Mortgage, NMLS #556677',
        quality: 74,
        issues: ['DTI at 41% is high', 'Credit score 720 (good not excellent)', 'Down payment 18% (under 20%)', 'Subject to final underwriting (not fully underwritten)'],
        highlights: ['Score: 720', 'DTI: 41%', 'Down Payment: 18%', 'Monthly: $3,383']
      },
      {
        content: 'MORTGAGE PRE-APPROVAL LETTER\n\nDate: [Current Date]\nBuyer: [Full Name]\n\nThis certifies FULLY UNDERWRITTEN pre-approval for:\n\nLoan Amount: Up to $550,000\nLoan Type: Conventional 30-year fixed\nInterest Rate: 6.25% (60-day lock upon contract)\nDown Payment: 20% ($110,000) - funds verified and sourced\nDebt-to-Income: 28% (excellent, well below 43% threshold)\nCredit Score: 745 (excellent)\nMonthly Payment: $3,383 (P&I)\n\nComplete Documentation Verified:\n✓ 3 years employment with current employer\n✓ Income: W-2s, pay stubs, tax returns (2 years)\n✓ Down payment: verified liquid assets ($110,000+)\n✓ Reserves: 6 months PITI beyond down payment\n✓ Credit report: no derogatory items\n✓ All debt obligations verified\n\nFull Underwriting Completed:\nNo additional documentation required except:\n- Property appraisal, title, insurance\n- Final employment/asset verification before closing\n- Property must meet conventional standards\n\nConditions:\n- Property appraisal at or above purchase price\n- Property meets Fannie Mae/Freddie Mac guidelines\n- Continued employment (verified before closing)\n- No material financial changes\n\nValidity: 90 days from date above\nRate Lock: 60-day lock available immediately upon contract\n\nStrength: Fully underwritten with complete documentation. Loan will close subject only to standard property conditions.\n\nUnderwriter: Thomas Anderson, Senior Underwriter\nLoan Officer: Maria Rodriguez, NMLS #334455\nLender: First National Mortgage, NMLS #556677\nLicense: State Mortgage License #123789',
        quality: 98,
        issues: [],
        highlights: ['FULLY UNDERWRITTEN', 'DTI: 28% (excellent)', 'Reserves: 6 months PITI', '20% down verified and sourced']
      }
    ]
  },
  'closing-disclosure': {
    easy: [
      {
        content: 'CLOSING DISCLOSURE\n\nProperty: [Address]\nSale Price: $400,000\n\nLOAN TERMS:\nLoan Amount: $320,000\nInterest Rate: 6.5%\nMonthly P&I: $2,023\n\nCLOSING COSTS:\nOrigination: $2,100\nServices: $3,850\nTaxes/Fees: $850\nPrepaids: $2,594\nEscrow: $1,500\nOther: $600\n\nTotal Closing Costs: $11,494\n\nCASH TO CLOSE:\nDown Payment: $80,000\nClosing Costs: $11,494\nSeller Credit: -$3,000\nTotal Required: $88,494\n\nBorrower Signature: _________ Date: _____',
        quality: 32,
        issues: ['Missing APR', 'No Loan Estimate comparison', 'No TRID 3-day notice', 'No payment rise disclosure'],
        highlights: ['Total: $88,494', 'Closing: $11,494', 'Rate: 6.5%']
      },
      {
        content: 'CLOSING DISCLOSURE (CD)\n\nIssued: [Date - 3 business days before closing per TRID]\n\nProperty: [Address]\nSale Price: $400,000\n\nLOAN TERMS:\nLoan Amount: $320,000\nInterest Rate: 6.5% (FIXED)\nAPR: 6.72%\nMonthly P&I: $2,023\n\nCan interest rate rise? NO\nCan payment rise? YES (taxes/insurance)\n\nCLOSING COSTS:\nOrigination: $2,100\nServices (Cannot Shop): $800\nServices (Did Shop): $3,050\nTaxes/Fees: $850\nPrepaids: $2,594\nEscrow: $1,500\nOther: $600\n\nTotal: $11,494\n\nCASH TO CLOSE:\nDown Payment: $80,000\nClosing Costs: $11,494\nSeller Credit: -$3,000\nTotal: $88,494\n\nLOAN ESTIMATE COMPARISON:\n- Estimate: $11,150\n- Final: $11,494\n- Difference: +$344 (within 10% tolerance)\n\nMeets TRID requirements.\n\nBorrower Signature: _________ Date: _____',
        quality: 98,
        issues: [],
        highlights: ['3 days before closing per TRID', 'APR: 6.72%', 'Difference: +$344 (within tolerance)', 'TRID compliant']
      }
    ],
    medium: [
      {
        content: 'CLOSING DISCLOSURE\n\nIssued: [Date]\n\nProperty: [Address]\nSale Price: $485,000\n\nLOAN TERMS:\nLoan Amount: $388,000\nInterest Rate: 6.75% (Fixed)\nAPR: 6.89%\nMonthly P&I: $2,516\n\nCan interest rate rise? NO\n\nMONTHLY PAYMENTS:\nYears 1-7: $2,966/month\n- P&I: $2,516\n- Escrow: $450\n\nCLOSING COSTS:\nOrigination: $2,500\nServices (Cannot Shop): $950\nServices (Did Shop): $3,400\nTaxes/Fees: $1,025\nPrepaids: $2,890\nEscrow: $1,800\nOther: $750\n\nTotal: $13,315\n\nCASH TO CLOSE:\nDown Payment: $97,000\nClosing Costs: $13,315\nTotal: $110,315\n\nLOAN ESTIMATE COMPARISON:\n- Estimate: $12,850\n- Final: $13,315\n- Difference: +$465\n\nLoan Officer: [Name]\nPhone: (555) 456-7890\n\nBorrower Signature: _________ Date: _____',
        quality: 69,
        issues: ['Missing TRID 3-day notice', 'No explanation if payment can rise', 'No tolerance explanation for +$465', 'Limited contact info'],
        highlights: ['APR: 6.89%', 'Difference: +$465', 'Total: $110,315', 'Monthly: $2,966']
      },
      {
        content: 'CLOSING DISCLOSURE (CD)\n\nIssued: [Date - 3 business days before closing per TRID]\n\nProperty: [Address]\nSale Price: $485,000\n\nLOAN TERMS:\nLoan Amount: $388,000\nInterest Rate: 6.75% (FIXED for entire term)\nAPR: 6.89%\nMonthly P&I: $2,516\n\nCan interest rate rise? NO - Fixed for life of loan\nCan payment rise? YES - Taxes and insurance may increase\n\nPROJECTED PAYMENTS:\nYears 1-7: $2,966/month\n- P&I: $2,516 (fixed)\n- Escrow: $450 (property taxes & insurance)\n\nYears 8-30: May vary based on tax/insurance changes\n\nCLOSING COSTS ITEMIZED:\nOrigination: $2,500\n- Loan origination: $1,940\n- Application fee: $350\n- Underwriting: $210\n\nServices (Cannot Shop): $950\nServices (Did Shop): $3,400\nTaxes/Fees: $1,025\nPrepaids: $2,890\nEscrow: $1,800\nOther: $750\n\nTotal: $13,315\n\nCASH TO CLOSE:\nDown Payment: $97,000\nClosing Costs: $13,315\nTotal: $110,315\n\nLOAN ESTIMATE COMPARISON:\n- Estimate: $12,850\n- Final: $13,315\n- Difference: +$465 (3.6% increase, within 10% tolerance)\n\nContact: [Name], NMLS #445566\nPhone: (555) 456-7890\nEmail: loanofficer@lender.com\n\nMeets TRID requirements. Must receive 3 business days before closing.\n\nBorrower Signature: _________ Date: _____',
        quality: 96,
        issues: [],
        highlights: ['3 days before closing per TRID', 'Itemized breakdown', 'Difference: +$465 (3.6%, within 10%)', 'Complete contact info']
      }
    ],
    hard: [
      {
        content: 'CLOSING DISCLOSURE (CD)\n\nIssued: [Date]\n\nProperty: [Address]\nSale Price: $625,000\n\nLOAN TERMS:\nLoan Amount: $500,000\nInterest Rate: 6.625% (Fixed for 30 years)\nAPR: 6.78%\nMonthly P&I: $3,214\n\nCan interest rate rise? NO\nCan payment rise? YES (taxes/insurance)\n\nPROJECTED PAYMENTS:\nYears 1-7: $3,839/month\n- P&I: $3,214\n- Escrow: $625\n\nCLOSING COSTS ITEMIZED:\nOrigination: $3,200\nServices (Cannot Shop): $1,150\nServices (Did Shop): $4,200\nTaxes/Fees: $1,450\nPrepaids: $3,750\nEscrow: $2,500\nOther: $950\n\nTotal: $17,200\n\nCASH TO CLOSE:\nDown Payment: $125,000\nClosing Costs: $17,200\nSeller Credit: -$5,000\nAdjustments: +$250\nTotal: $137,450\n\nLOAN ESTIMATE COMPARISON:\n- Estimate: $16,500\n- Final: $17,200\n- Change: +$700\n\nLoan Officer: [Name]\nPhone: (555) 567-8901\n\nReview carefully and contact with questions.\n\nBorrower Signature: _________ Date: _____',
        quality: 73,
        issues: ['Missing TRID 3-day notice', 'No tolerance explanation for +$700', 'Adjustments not itemized', 'Years 8-30 projection missing'],
        highlights: ['APR: 6.78%', 'Change: +$700', 'Seller Credit: -$5,000', 'Adjustments: +$250']
      },
      {
        content: 'CLOSING DISCLOSURE (CD)\n\nIssued: [Date - Must be delivered 3 business days before closing per TRID]\n\nProperty: [Address]\nSale Price: $625,000\n\nLOAN TERMS:\nLoan Amount: $500,000\nInterest Rate: 6.625% (FIXED for entire 30-year term)\nAPR: 6.78% (includes interest, fees, and costs)\nMonthly P&I: $3,214\n\nCan interest rate rise? NO - This is a fixed-rate loan\nCan payment rise? YES - Property taxes and insurance may increase\n\nPROJECTED PAYMENTS:\nYears 1-7: $3,839/month\n- P&I: $3,214 (never changes)\n- Escrow: $625\n\nYears 8-30: May vary\n- P&I: $3,214 (never changes)\n- Escrow: May increase due to tax/insurance changes\n\nCLOSING COSTS ITEMIZED:\nOrigination: $3,200\n- Loan origination fee: $2,500\n- Application fee: $400\n- Underwriting fee: $300\n\nServices (Cannot Shop): $1,150\nServices (Did Shop): $4,200\nTaxes/Fees: $1,450\nPrepaids: $3,750\nEscrow: $2,500\nOther: $950\n\nTotal: $17,200\n\nCASH TO CLOSE:\nDown Payment: $125,000\nClosing Costs: $17,200\nSeller Credit (for repairs): -$5,000\nProration Adjustments:\n  • Property taxes (seller paid): +$150\n  • HOA dues (seller prepaid): +$100\nTotal: $137,450\n\nLOAN ESTIMATE COMPARISON:\n- LE Closing Costs: $16,500\n- Final Closing Costs: $17,200\n- Increase: +$700 (4.2% increase)\n- Status: Within 10% tolerance (allowed under TRID)\n- Reason: Higher title insurance and survey costs\n\nCONTACT INFORMATION:\nLoan Officer: [Name], NMLS #667788\nPhone: (555) 567-8901\nEmail: loanofficer@lender.com\nClosure Coordinator: [Name]\nPhone: (555) 567-8902\n\nIMPORTANT DATES:\n- CD Issued: [Date]\n- Scheduled Closing: [Date + 3 business days minimum]\n- First Payment Due: [Date + ~45 days]\n\nMeets TILA-RESPA Integrated Disclosure (TRID) requirements. Federal law requires you receive this at least 3 business days before closing.\n\nBorrower Signature: _________ Date: _____',
        quality: 99,
        issues: [],
        highlights: ['TRID 3-day requirement stated', 'Complete itemization', 'Adjustments explained ($150 taxes, $100 HOA)', 'Change +$700 explained (4.2%, within 10%)']
      }
    ]
  }
};