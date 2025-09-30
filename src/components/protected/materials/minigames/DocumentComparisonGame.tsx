import React, { useState, useEffect } from 'react';

interface RobotoFontProps {
  children: React.ReactNode;
  className?: string;
  weight?: number;
  as?: keyof JSX.IntrinsicElements;
}

const RobotoFont: React.FC<RobotoFontProps> = ({ children, className = '', weight = 400, as }) => {
  const Tag = as || 'div';
  return (
    <Tag className={className} style={{ fontFamily: 'Roboto, sans-serif', fontWeight: weight }}>
      {children}
    </Tag>
  );
};

type DocumentType = 'purchase-agreement' | 'home-inspection' | 'mortgage-pre-approval' | 'closing-disclosure';
type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

interface Document {
  id: string;
  content: string;
  quality: number;
  issues: string[];
  highlights: string[];
}

interface DocumentTypeConfig {
  id: DocumentType;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  requiredScore: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
}

const DocumentComparisonGame: React.FC = () => {
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('easy');
  const [currentDocuments, setCurrentDocuments] = useState<[Document, Document] | null>(null);
  const [winner, setWinner] = useState<Document | null>(null);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [round, setRound] = useState(1);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [roundTimes, setRoundTimes] = useState<number[]>([]);
  const [showExplanation, setShowExplanation] = useState(false);
  const [knowledgeBank, setKnowledgeBank] = useState<Set<string>>(new Set());
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'first-win', title: 'First Success', description: 'Choose your first correct document', icon: '🎯', earned: false },
    { id: 'perfect-score', title: 'Perfect Score', description: 'Get 5/5 correct', icon: '⭐', earned: false },
    { id: 'speed-demon', title: 'Speed Demon', description: 'Average under 10 seconds per round', icon: '⚡', earned: false },
    { id: 'streak-master', title: 'Streak Master', description: 'Get a 5-round streak', icon: '🔥', earned: false },
    { id: 'knowledge-seeker', title: 'Knowledge Seeker', description: 'Learn 10 different issues', icon: '📚', earned: false },
  ]);
  const [unlockedDocs, setUnlockedDocs] = useState<Set<DocumentType>>(new Set(['purchase-agreement']));

  const documentTypes: DocumentTypeConfig[] = [
    {
      id: 'purchase-agreement',
      title: 'Purchase Agreement',
      description: 'Compare real estate purchase agreements',
      icon: '📄',
      unlocked: true,
      requiredScore: 0
    },
    {
      id: 'home-inspection',
      title: 'Home Inspection Report',
      description: 'Evaluate home inspection documents',
      icon: '🏠',
      unlocked: unlockedDocs.has('home-inspection'),
      requiredScore: 15
    },
    {
      id: 'mortgage-pre-approval',
      title: 'Mortgage Pre-Approval',
      description: 'Review mortgage pre-approval letters',
      icon: '💰',
      unlocked: unlockedDocs.has('mortgage-pre-approval'),
      requiredScore: 30
    },
    {
      id: 'closing-disclosure',
      title: 'Closing Disclosure',
      description: 'Assess closing disclosure forms',
      icon: '📋',
      unlocked: unlockedDocs.has('closing-disclosure'),
      requiredScore: 50
    }
  ];

  const difficultyConfig: Record<DifficultyLevel, { multiplier: number; label: string; color: string; description: string }> = {
    easy: { multiplier: 1, label: 'Easy', color: 'bg-green-500', description: 'Obvious differences' },
    medium: { multiplier: 1.5, label: 'Medium', color: 'bg-yellow-500', description: 'Some subtlety' },
    hard: { multiplier: 2, label: 'Hard', color: 'bg-orange-500', description: 'Careful reading needed' },
    expert: { multiplier: 3, label: 'Expert', color: 'bg-red-500', description: 'Very subtle issues' }
  };

  const documentContent: Record<DocumentType, Record<DifficultyLevel, Array<{ content: string; quality: number; issues: string[]; highlights: string[] }>>> = {
    'purchase-agreement': {
      easy: [
        {
          content: 'Purchase Agreement\n\nProperty: 123 Main St\nPrice: $350,000\nContingencies: Financing, Inspection\nClosing Date: 60 days\nDeposit: $5,000\n\nBuyer and Seller signatures required.',
          quality: 42,
          issues: ['No specific contingency deadlines', 'Missing earnest money deposit details', 'No appraisal contingency', 'Vague closing timeline'],
          highlights: ['Contingencies: Financing, Inspection', 'Closing Date: 60 days', 'Deposit: $5,000']
        },
        {
          content: 'Purchase Agreement\n\nProperty Address: 123 Main St, City, State, ZIP\nPurchase Price: $350,000\nEarnest Money Deposit: $10,000 (3% of purchase price)\n\nContingencies:\n- Financing Contingency: 30 days from acceptance\n- Inspection Contingency: 17 days from acceptance\n- Appraisal Contingency: Property must appraise at or above purchase price\n- Title Contingency: Clear title required\n\nClosing Date: Within 45 days of acceptance\nPossession: Day of closing at 5:00 PM\n\nInclusions: All fixtures, appliances, window coverings\nExclusions: Family heirloom chandelier in dining room\n\nSeller Disclosure: Attached and acknowledged\nLead Paint Disclosure: Attached (if built before 1978)\n\nSignatures:\nBuyer: _________________ Date: _______\nSeller: _________________ Date: _______\n\nAll contingencies have specific deadlines and clear terms.',
          quality: 98,
          issues: [],
          highlights: ['Contingencies:', '- Financing Contingency: 30 days', '- Inspection Contingency: 17 days', '- Appraisal Contingency', 'Earnest Money Deposit: $10,000 (3%)', 'Closing Date: Within 45 days']
        }
      ],
      medium: [],
      hard: [],
      expert: []
    },
    'home-inspection': {
      easy: [
        {
          content: 'Home Inspection Report\n\nProperty: 555 Maple Dr\nInspection Date: [Date]\n\nRoof: Some shingles loose\nFoundation: Cracks observed\nElectrical: Works fine\nPlumbing: Good\nHVAC: Functional\n\nRecommendations: Fix roof and foundation issues.\n\nInspector: John Smith',
          quality: 35,
          issues: ['No specific details on defects', 'Missing safety concerns', 'No cost estimates', 'Incomplete system evaluations'],
          highlights: ['Roof: Some shingles loose', 'Foundation: Cracks observed', 'Electrical: Works fine']
        },
        {
          content: 'Comprehensive Home Inspection Report\n\nProperty: 555 Maple Drive, [Full Address]\nInspection Date: [Date]\nInspector: John Smith, Certified #12345\n\nEXECUTIVE SUMMARY:\nMajor Concerns: 2 items requiring immediate attention\nSafety Issues: 1 item\nMaintenance Items: 8 items\n\nROOFING SYSTEM:\n- Age: Approximately 18 years (25-year rated shingles)\n- Condition: 15-20 shingles loose/missing on south slope\n- Recommendation: Repair within 6 months; budget for replacement in 3-5 years\n- Estimated Cost: $800-1,200 for repairs\n\nFOUNDATION:\n- Material: Poured concrete\n- Observed: Hairline cracks in northeast corner (1/16" width, 3 feet long)\n- Assessment: Typical settling, monitor for expansion\n- Recommendation: Seal cracks, install monitoring markers\n- Estimated Cost: $300-500\n\nELECTRICAL SYSTEM:\n- Service: 200-amp panel, adequate for home size\n- Condition: Good overall\n- Minor Issue: 2 GFCI outlets in bathrooms not functioning\n- Recommendation: Replace GFCI outlets ($150-200)\n\nPLUMBING:\n- Supply: Copper lines, good condition\n- Drains: PVC, functioning properly\n- Water Heater: 8 years old, 40-gallon, maintenance current\n\nHVAC:\n- Heating: Forced air gas furnace, 12 years old\n- Cooling: Central AC, 10 years old\n- Condition: Both operational, recommend annual servicing\n\nADDITIONAL ITEMS INSPECTED:\n- Insulation, ventilation, windows, doors, all documented\n\nAll photos and detailed findings attached.\n\nThis inspection meets ASHI standards.',
          quality: 96,
          issues: [],
          highlights: ['EXECUTIVE SUMMARY:', 'Major Concerns: 2 items', 'Estimated Cost: $800-1,200 for repairs', 'All photos and detailed findings attached']
        }
      ],
      medium: [],
      hard: [],
      expert: []
    },
    'mortgage-pre-approval': {
      easy: [
        {
          content: 'Mortgage Pre-Approval Letter\n\nTo Whom It May Concern:\n\nThis letter confirms that [Buyer Name] has been pre-approved for a mortgage loan up to $400,000.\n\nInterest Rate: Competitive rates available\nDown Payment: Standard required\n\nThis pre-approval is valid for 90 days.\n\nSincerely,\nQuick Loan Company',
          quality: 28,
          issues: ['No specific interest rate', 'No loan type specified', 'Missing lender license information', 'No conditions or documentation requirements listed'],
          highlights: ['pre-approved for a mortgage loan up to $400,000', 'Competitive rates available', 'Down Payment: Standard required']
        },
        {
          content: 'MORTGAGE PRE-APPROVAL LETTER\n\nDate: [Current Date]\n\nTO: Sellers and Listing Agents\nRE: Mortgage Pre-Approval for [Buyer Full Name]\n\nThis letter certifies that [Buyer Name] has been pre-approved for a mortgage loan with the following terms:\n\nLoan Amount: Up to $400,000\nLoan Type: Conventional 30-year fixed-rate mortgage\nEstimated Interest Rate: 6.75% (subject to market conditions at lock)\nDown Payment: 20% ($80,000) verified and documented\nDebt-to-Income Ratio: 32% (within excellent range)\n\nDOCUMENTATION VERIFIED:\n✓ Employment and income (W-2s, pay stubs, tax returns)\n✓ Assets and down payment funds (bank statements)\n✓ Credit report (score: 760)\n✓ Debt obligations (student loans, auto loans)\n\nCONDITIONS:\n- Pre-approval based on property appraisal meeting purchase price\n- Property must meet lending standards\n- No material changes to buyer\'s financial situation\n\nVALIDITY: This pre-approval is valid for 90 days from the date above. Interest rate must be locked at time of purchase contract.\n\nBuyer is financially qualified and has demonstrated ability to close on a property up to $400,000.\n\nUnderwriter: Jennifer Martinez, NMLS #123456\nLender: Premier Mortgage Company\nLicense: State Mortgage License #789012\nPhone: (555) 123-4567\n\nThis is a creditworthy borrower ready to proceed with a purchase.\n\nSincerely,\nLoan Officer Name\nNMLS #654321',
          quality: 97,
          issues: [],
          highlights: ['Estimated Interest Rate: 6.75%', 'Down Payment: 20% ($80,000) verified and documented', 'DOCUMENTATION VERIFIED:', 'Underwriter: Jennifer Martinez, NMLS #123456']
        }
      ],
      medium: [],
      hard: [],
      expert: []
    },
    'closing-disclosure': {
      easy: [
        {
          content: 'Closing Disclosure Summary\n\nLoan Amount: $320,000\nInterest Rate: 6.5%\nMonthly Payment: $2,023\n\nClosing Costs: $8,500\n- Loan fees: $2,100\n- Title fees: $2,200\n- Other fees: $4,200\n\nCash to Close: $88,500\n\nSigned: ___________',
          quality: 25,
          issues: ['Missing detailed breakdown', 'No comparison to Loan Estimate', 'No APR listed', 'Missing important disclosures'],
          highlights: ['Closing Costs: $8,500', 'Other fees: $4,200', 'Cash to Close: $88,500']
        },
        {
          content: 'CLOSING DISCLOSURE (CD)\n\nIssued: [Date - Must be 3 business days before closing per TRID]\n\nBORROWER: [Name and Address]\nSELLER: [Name and Address]\nLENDER: [Lender Name, Address, NMLS#]\n\nPROPERTY: [Full Address]\nSALE PRICE: $400,000\n\nLOAN TERMS:\nLoan Amount: $320,000\nInterest Rate: 6.5% (FIXED for entire loan term)\nAPR: 6.72%\nMonthly Principal & Interest: $2,023\nLoan Term: 30 years (360 monthly payments)\nPrepayment Penalty: NO\nBalloon Payment: NO\n\nCan your interest rate rise? NO\nCan your monthly payment rise? YES (Taxes and insurance can increase)\n\nPROJECTED PAYMENTS:\nYears 1-7: $2,423/month\n- Principal & Interest: $2,023\n- Mortgage Insurance: $0\n- Estimated Escrow: $400/month\n\nCLOSING COSTS ITEMIZED:\nSection A - Origination Charges: $2,100\nSection B - Services Borrower Did Not Shop For: $800\nSection C - Services Borrower Did Shop For: $3,050\nSection E - Taxes & Government Fees: $850\nSection F - Prepaids: $2,594\nSection G - Initial Escrow Payment: $1,500\nSection H - Other: $600\n\nTOTAL CLOSING COSTS: $11,494\n\nCASH TO CLOSE:\nDown Payment (20%): $80,000\nClosing Costs: $11,494\nSeller Credit: -$3,000\nTotal Cash to Close: $88,494\n\nCOMPARISON TO LOAN ESTIMATE:\n- Loan Estimate Closing Costs: $11,150\n- Final Closing Costs: $11,494\n- Difference: +$344 (within 10% tolerance)\n\nThis document meets all TILA-RESPA Integrated Disclosure (TRID) requirements.\n\nBorrower Signature: _________________ Date: _______',
          quality: 98,
          issues: [],
          highlights: ['Issued: [Date - Must be 3 business days before closing per TRID]', 'COMPARISON TO LOAN ESTIMATE', 'Difference: +$344 (within 10% tolerance)', 'This document meets all TILA-RESPA Integrated Disclosure (TRID) requirements']
        }
      ],
      medium: [],
      hard: [],
      expert: []
    }
  };

  useEffect(() => {
    if (currentDocuments && !winner) {
      setStartTime(Date.now());
    }
  }, [currentDocuments, winner]);

  useEffect(() => {
    const newAchievements = [...achievements];
    let updated = false;

    if (score > 0 && !newAchievements[0].earned) {
      newAchievements[0].earned = true;
      updated = true;
    }

    if (round > 5 && score === 5 && !newAchievements[1].earned) {
      newAchievements[1].earned = true;
      updated = true;
    }

    if (round > 5 && roundTimes.length === 5) {
      const avgTime = roundTimes.reduce((a, b) => a + b, 0) / roundTimes.length;
      if (avgTime < 10000 && !newAchievements[2].earned) {
        newAchievements[2].earned = true;
        updated = true;
      }
    }

    if (bestStreak >= 5 && !newAchievements[3].earned) {
      newAchievements[3].earned = true;
      updated = true;
    }

    if (knowledgeBank.size >= 10 && !newAchievements[4].earned) {
      newAchievements[4].earned = true;
      updated = true;
    }

    if (updated) {
      setAchievements(newAchievements);
    }
  }, [score, round, roundTimes, bestStreak, knowledgeBank, achievements]);

  useEffect(() => {
    const newUnlocked = new Set(unlockedDocs);
    let updated = false;

    if (totalScore >= 15 && !newUnlocked.has('home-inspection')) {
      newUnlocked.add('home-inspection');
      updated = true;
    }
    if (totalScore >= 30 && !newUnlocked.has('mortgage-pre-approval')) {
      newUnlocked.add('mortgage-pre-approval');
      updated = true;
    }
    if (totalScore >= 50 && !newUnlocked.has('closing-disclosure')) {
      newUnlocked.add('closing-disclosure');
      updated = true;
    }

    if (updated) {
      setUnlockedDocs(newUnlocked);
    }
  }, [totalScore, unlockedDocs]);

  const generateDocuments = (docType: DocumentType, diff: DifficultyLevel): [Document, Document] => {
    const availableDocs = documentContent[docType][diff];
    if (!availableDocs || availableDocs.length < 2) {
      const easyDocs = documentContent[docType].easy;
      const shuffled = [...easyDocs].sort(() => Math.random() - 0.5);
      return [
        { id: '1', content: shuffled[0].content, quality: shuffled[0].quality, issues: shuffled[0].issues, highlights: shuffled[0].highlights },
        { id: '2', content: shuffled[1].content, quality: shuffled[1].quality, issues: shuffled[1].issues, highlights: shuffled[1].highlights }
      ];
    }
    
    const shuffled = [...availableDocs].sort(() => Math.random() - 0.5);
    return [
      { id: '1', content: shuffled[0].content, quality: shuffled[0].quality, issues: shuffled[0].issues, highlights: shuffled[0].highlights },
      { id: '2', content: shuffled[1].content, quality: shuffled[1].quality, issues: shuffled[1].issues, highlights: shuffled[1].highlights }
    ];
  };

  const handleDocTypeSelect = (docType: DocumentType) => {
    setSelectedDocType(docType);
    const docs = generateDocuments(docType, difficulty);
    setCurrentDocuments(docs);
    setWinner(null);
    setScore(0);
    setRound(1);
    setStreak(0);
    setRoundTimes([]);
  };

  const handleDocumentSelect = (selectedDoc: Document) => {
    if (!currentDocuments || !startTime) return;

    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    setRoundTimes([...roundTimes, timeTaken]);

    const otherDoc = currentDocuments.find(doc => doc.id !== selectedDoc.id);
    if (!otherDoc) return;

    const betterDoc = selectedDoc.quality > otherDoc.quality ? selectedDoc : otherDoc;
    const worseDoc = selectedDoc.quality > otherDoc.quality ? otherDoc : selectedDoc;
    const isCorrect = selectedDoc.id === betterDoc.id;

    const basePoints = 10;
    const difficultyBonus = Math.floor(basePoints * (difficultyConfig[difficulty].multiplier - 1));
    const speedBonus = timeTaken < 15000 ? 5 : timeTaken < 30000 ? 3 : 0;
    const streakBonus = streak >= 3 ? streak * 2 : 0;
    const pointsEarned = isCorrect ? basePoints + difficultyBonus + speedBonus + streakBonus : 0;

    if (isCorrect) {
      setScore(score + 1);
      setTotalScore(totalScore + pointsEarned);
      setStreak(streak + 1);
      if (streak + 1 > bestStreak) {
        setBestStreak(streak + 1);
      }
      
      const newKnowledge = new Set(knowledgeBank);
      worseDoc.issues.forEach((issue: string) => newKnowledge.add(issue));
      setKnowledgeBank(newKnowledge);
    } else {
      setStreak(0);
    }

    setWinner(betterDoc);
    setShowExplanation(true);
  };

  const handleContinue = () => {
    if (round < 5 && selectedDocType) {
      const newDocs = generateDocuments(selectedDocType, difficulty);
      setCurrentDocuments(newDocs);
      setWinner(null);
      setShowExplanation(false);
      setRound(round + 1);
      setStartTime(null);
    }
  };

  const handleReset = () => {
    setSelectedDocType(null);
    setCurrentDocuments(null);
    setWinner(null);
    setScore(0);
    setRound(1);
    setStreak(0);
    setRoundTimes([]);
    setShowExplanation(false);
    setStartTime(null);
  };

  const handlePlayAgain = () => {
    if (selectedDocType) {
      const docs = generateDocuments(selectedDocType, difficulty);
      setCurrentDocuments(docs);
      setWinner(null);
      setScore(0);
      setRound(1);
      setStreak(0);
      setRoundTimes([]);
      setShowExplanation(false);
      setStartTime(null);
    }
  };

  if (!selectedDocType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <RobotoFont className="text-4xl font-bold text-gray-900 mb-4">
              📚 Document Comparison Game
            </RobotoFont>
            <RobotoFont className="text-lg text-gray-600 mb-6">
              Learn to identify high-quality homebuying documents through comparison. Earn points, unlock new document types, and build your knowledge!
            </RobotoFont>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                <RobotoFont className="text-sm opacity-90">Total Score</RobotoFont>
                <RobotoFont className="text-3xl font-bold">{totalScore}</RobotoFont>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                <RobotoFont className="text-sm opacity-90">Best Streak</RobotoFont>
                <RobotoFont className="text-3xl font-bold">{bestStreak} 🔥</RobotoFont>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white">
                <RobotoFont className="text-sm opacity-90">Knowledge Bank</RobotoFont>
                <RobotoFont className="text-3xl font-bold">{knowledgeBank.size} 📖</RobotoFont>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                <RobotoFont className="text-sm opacity-90">Achievements</RobotoFont>
                <RobotoFont className="text-3xl font-bold">{achievements.filter(a => a.earned).length}/5 🏆</RobotoFont>
              </div>
            </div>

            <div className="border-t pt-4">
              <RobotoFont className="text-sm font-semibold text-gray-700 mb-3">Achievements</RobotoFont>
              <div className="flex gap-3">
                {achievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`flex-1 rounded-lg p-3 text-center transition-all ${
                      achievement.earned 
                        ? 'bg-yellow-100 border-2 border-yellow-400' 
                        : 'bg-gray-100 border-2 border-gray-300 opacity-50'
                    }`}
                    title={achievement.description}
                  >
                    <div className="text-2xl mb-1">{achievement.icon}</div>
                    <RobotoFont className="text-xs font-medium text-gray-700">
                      {achievement.title}
                    </RobotoFont>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <RobotoFont className="text-xl font-bold text-gray-900 mb-4">
              Select Difficulty
            </RobotoFont>
            <div className="grid grid-cols-4 gap-4">
              {(Object.keys(difficultyConfig) as DifficultyLevel[]).map((diff: DifficultyLevel) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    difficulty === diff
                      ? `${difficultyConfig[diff].color} border-transparent text-white`
                      : 'bg-white border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <RobotoFont className="font-bold text-lg mb-1">
                    {difficultyConfig[diff].label}
                  </RobotoFont>
                  <RobotoFont className="text-sm opacity-90">
                    {difficultyConfig[diff].description}
                  </RobotoFont>
                  <RobotoFont className="text-xs mt-2 font-semibold">
                    {difficultyConfig[diff].multiplier}x points
                  </RobotoFont>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <RobotoFont className="text-xl font-bold text-gray-900 mb-4">
              Choose Document Type
            </RobotoFont>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {documentTypes.map((docType) => (
                <button
                  key={docType.id}
                  onClick={() => docType.unlocked && handleDocTypeSelect(docType.id)}
                  disabled={!docType.unlocked}
                  className={`p-6 rounded-xl border-2 text-left transition-all ${
                    docType.unlocked
                      ? 'bg-white border-gray-300 hover:border-blue-500 hover:shadow-lg cursor-pointer'
                      : 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-4xl">{docType.icon}</div>
                    {!docType.unlocked && (
                      <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        🔒 {docType.requiredScore} pts
                      </div>
                    )}
                  </div>
                  <RobotoFont className="text-xl font-bold text-gray-900 mb-2">
                    {docType.title}
                  </RobotoFont>
                  <RobotoFont className="text-gray-600">
                    {docType.description}
                  </RobotoFont>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (round > 5) {
    const avgTime = roundTimes.length > 0 
      ? (roundTimes.reduce((a, b) => a + b, 0) / roundTimes.length / 1000).toFixed(1)
      : '0';

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-6">
              {score === 5 ? '🎉' : score >= 4 ? '🌟' : score >= 3 ? '👍' : '📚'}
            </div>
            <RobotoFont className="text-4xl font-bold text-gray-900 mb-4">
              Round Complete!
            </RobotoFont>
            
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-6 text-white">
              <RobotoFont className="text-6xl font-bold mb-2">
                {score} / 5
              </RobotoFont>
              <RobotoFont className="text-xl opacity-90">
                {score === 5 && "Perfect! You're an expert at identifying quality documents!"}
                {score === 4 && "Excellent! You have a great eye for detail!"}
                {score === 3 && "Good job! You're learning the key differences!"}
                {score < 3 && "Keep practicing! Review the knowledge bank below!"}
              </RobotoFont>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 rounded-xl p-4">
                <RobotoFont className="text-sm text-gray-600 mb-1">Avg Time</RobotoFont>
                <RobotoFont className="text-2xl font-bold text-blue-600">{avgTime}s</RobotoFont>
              </div>
              <div className="bg-purple-50 rounded-xl p-4">
                <RobotoFont className="text-sm text-gray-600 mb-1">Best Streak</RobotoFont>
                <RobotoFont className="text-2xl font-bold text-purple-600">{bestStreak} 🔥</RobotoFont>
              </div>
              <div className="bg-green-50 rounded-xl p-4">
                <RobotoFont className="text-sm text-gray-600 mb-1">Points Earned</RobotoFont>
                <RobotoFont className="text-2xl font-bold text-green-600">+{totalScore}</RobotoFont>
              </div>
            </div>

            {knowledgeBank.size > 0 && (
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mb-6 text-left">
                <RobotoFont className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                  📖 Knowledge Gained This Session
                </RobotoFont>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Array.from(knowledgeBank).map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-white rounded-lg p-3">
                      <span className="text-amber-500 font-bold">•</span>
                      <RobotoFont className="text-sm text-gray-700">{issue}</RobotoFont>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {achievements.some(a => a.earned) && (
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mb-6">
                <RobotoFont className="font-bold text-gray-900 mb-2">🏆 Achievements Unlocked!</RobotoFont>
                <div className="flex gap-2 justify-center flex-wrap">
                  {achievements.filter(a => a.earned).map(achievement => (
                    <div key={achievement.id} className="bg-white rounded-lg px-3 py-2 border border-yellow-300">
                      <span className="mr-2">{achievement.icon}</span>
                      <RobotoFont as="span" className="text-sm font-medium">{achievement.title}</RobotoFont>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={handlePlayAgain}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
              >
                <RobotoFont>▶ Play Again</RobotoFont>
              </button>
              <button
                onClick={handleReset}
                className="bg-white text-gray-700 px-8 py-4 rounded-xl font-bold text-lg border-2 border-gray-300 hover:border-gray-400 transition-all"
              >
                <RobotoFont>← Choose Different Document</RobotoFont>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentDocTypeName = documentTypes.find(dt => dt.id === selectedDocType)?.title || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={handleReset}
          className="mb-4 text-blue-600 hover:text-blue-700 flex items-center gap-2 font-semibold transition-colors"
        >
          <span>←</span>
          <RobotoFont>Back to Selection</RobotoFont>
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <RobotoFont className="text-3xl font-bold text-gray-900 mb-2">
                {currentDocTypeName}
              </RobotoFont>
              <div className="flex items-center gap-4">
                <RobotoFont className="text-gray-600">
                  Round <span className="font-bold text-blue-600">{round}</span> of 5
                </RobotoFont>
                <div className="h-4 w-px bg-gray-300"></div>
                <RobotoFont className="text-gray-600">
                  Score: <span className="font-bold text-green-600">{score}</span>
                </RobotoFont>
                {streak > 0 && (
                  <>
                    <div className="h-4 w-px bg-gray-300"></div>
                    <RobotoFont className="text-orange-600 font-bold">
                      🔥 {streak} Streak!
                    </RobotoFont>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`${difficultyConfig[difficulty].color} text-white px-4 py-2 rounded-lg font-bold`}>
                <RobotoFont>{difficultyConfig[difficulty].label}</RobotoFont>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-bold">
                <RobotoFont>💎 {totalScore} pts</RobotoFont>
              </div>
            </div>
          </div>
          
          {!winner && (
            <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <RobotoFont className="text-blue-900 font-semibold">
                💡 Choose the better quality document
              </RobotoFont>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {currentDocuments?.map((doc) => {
            const isWinner = winner?.id === doc.id;
            const isLoser = winner && winner.id !== doc.id;
            
            return (
              <button
                key={doc.id}
                onClick={() => !winner && handleDocumentSelect(doc)}
                disabled={!!winner}
                className={`bg-white rounded-2xl shadow-lg p-6 text-left transition-all ${
                  !winner ? 'hover:shadow-xl hover:scale-[1.02] cursor-pointer' : 'cursor-not-allowed'
                } border-4 ${
                  isWinner
                    ? 'border-green-500 bg-green-50'
                    : isLoser
                    ? 'border-red-300 bg-red-50 opacity-75'
                    : 'border-transparent hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <RobotoFont className="text-xl font-bold text-gray-900">
                    Document {doc.id}
                  </RobotoFont>
                  {isWinner && (
                    <div className="bg-green-500 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2">
                      <span>✓</span>
                      <RobotoFont>Better Choice!</RobotoFont>
                    </div>
                  )}
                  {isLoser && (
                    <div className="bg-red-500 text-white px-4 py-2 rounded-full font-bold">
                      <RobotoFont>❌ Not Ideal</RobotoFont>
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4 mb-4 max-h-[400px] overflow-y-auto font-mono text-sm whitespace-pre-wrap">
                  {doc.content}
                </div>

                {winner && (
                  <div className="text-sm text-gray-600">
                    <RobotoFont className="font-semibold mb-1">Quality Score:</RobotoFont>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            doc.quality >= 90 ? 'bg-green-500' : doc.quality >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${doc.quality}%` }}
                        ></div>
                      </div>
                      <RobotoFont className="font-bold">{doc.quality}/100</RobotoFont>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {showExplanation && winner && currentDocuments && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
            <RobotoFont className="text-2xl font-bold text-gray-900 mb-4">
              📚 What You Should Know
            </RobotoFont>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                <RobotoFont className="font-bold text-green-900 mb-3 flex items-center gap-2">
                  <span>✓</span> Why This Document is Better
                </RobotoFont>
                <div className="space-y-2">
                  {winner.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-green-600 font-bold">•</span>
                      <RobotoFont className="text-sm text-gray-700">{highlight}</RobotoFont>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <RobotoFont className="font-bold text-red-900 mb-3 flex items-center gap-2">
                  <span>⚠</span> Issues with the Other Document
                </RobotoFont>
                <div className="space-y-2">
                  {currentDocuments.find(d => d.id !== winner.id)?.issues.map((issue, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">•</span>
                      <RobotoFont className="text-sm text-gray-700">{issue}</RobotoFont>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="mt-6 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              <RobotoFont>Continue to Next Round →</RobotoFont>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentComparisonGame;