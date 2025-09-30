import React, { useState } from 'react';
import RobotoFont from '../../../../assets/fonts';

type DocumentType = 'purchase-agreement' | 'home-inspection' | 'mortgage-pre-approval' | 'closing-disclosure';

interface Document {
  id: string;
  content: string;
  quality: number;
}

interface DocumentTypeConfig {
  id: DocumentType;
  title: string;
  description: string;
  icon: string;
}

const DocumentComparisonGame: React.FC = () => {
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(null);
  const [currentDocuments, setCurrentDocuments] = useState<[Document, Document] | null>(null);
  const [winner, setWinner] = useState<Document | null>(null);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);

  const documentTypes: DocumentTypeConfig[] = [
    {
      id: 'purchase-agreement',
      title: 'Purchase Agreement',
      description: 'Compare real estate purchase agreements',
      icon: '📄'
    },
    {
      id: 'home-inspection',
      title: 'Home Inspection Report',
      description: 'Evaluate home inspection documents',
      icon: '🏠'
    },
    {
      id: 'mortgage-pre-approval',
      title: 'Mortgage Pre-Approval',
      description: 'Review mortgage pre-approval letters',
      icon: '💰'
    },
    {
      id: 'closing-disclosure',
      title: 'Closing Disclosure',
      description: 'Assess closing disclosure forms',
      icon: '📋'
    }
  ];

  const documentContent: Record<DocumentType, Array<{ content: string; quality: number }>> = {
    'purchase-agreement': [
      {
        content: 'Purchase Agreement\n\nProperty: 123 Main St\nPrice: $350,000\nContingencies: Financing, Inspection\nClosing Date: 60 days\nEarnest Money: $5,000\nInspection Period: 10 days\nFinancing Contingency: 30 days',
        quality: 65
      },
      {
        content: 'Purchase Agreement\n\nProperty: 123 Main St\nPrice: $350,000\nContingencies: Financing, Inspection, Appraisal\nClosing Date: 45 days\nEarnest Money: $7,000\nInspection Period: 14 days\nFinancing Contingency: 30 days\nAppraisal Contingency: 21 days\nTitle Review Period: 7 days',
        quality: 85
      },
      {
        content: 'Purchase Agreement\n\nProperty: 123 Main St\nPrice: $350,000\nContingencies: Financing\nClosing Date: 30 days\nEarnest Money: $3,000\nInspection Period: 5 days',
        quality: 50
      },
      {
        content: 'Purchase Agreement\n\nProperty: 123 Main St\nPrice: $350,000\nContingencies: Financing, Inspection, Appraisal, Sale of Current Home\nClosing Date: 60 days\nEarnest Money: $10,000\nInspection Period: 14 days\nFinancing Contingency: 45 days\nAppraisal Contingency: 30 days\nSale Contingency: 60 days\nTitle Review: 10 days\nSeller Repairs: Negotiable',
        quality: 95
      }
    ],
    'home-inspection': [
      {
        content: 'Home Inspection Report\n\nInspector: John Smith\nDate: 03/15/2024\n\nRoof: Minor wear, 5 years remaining\nFoundation: Small cracks, monitor\nPlumbing: Functional\nElectrical: Up to code\nHVAC: Working condition',
        quality: 60
      },
      {
        content: 'Home Inspection Report\n\nInspector: John Smith, Certified\nLicense: #12345\nDate: 03/15/2024\n\nRoof: Minor wear, 5 years estimated life, needs gutter repair\nFoundation: Hairline cracks in basement, recommend monitoring\nPlumbing: All fixtures functional, minor leak under kitchen sink\nElectrical: Up to code, GFCI outlets present\nHVAC: 8 years old, serviced annually, working well\nAttic: Adequate insulation, no moisture issues\nCrawl Space: Dry, vapor barrier present',
        quality: 88
      },
      {
        content: 'Home Inspection Report\n\nInspector: John Smith\nDate: 03/15/2024\n\nRoof: Checked\nFoundation: Looks okay\nPlumbing: Working\nElectrical: Fine',
        quality: 40
      },
      {
        content: 'Home Inspection Report\n\nInspector: John Smith, Certified Professional Inspector\nLicense: #12345, Insured\nDate: 03/15/2024\nPhotos: 87 attached\n\nRoof: Asphalt shingles, minor granule loss, 5-7 years remaining, recommend gutter repair ($300)\nFoundation: Poured concrete, hairline cracks (common settling), recommend annual monitoring\nPlumbing: All fixtures tested, minor leak under kitchen sink ($150 repair), water pressure 65 PSI (excellent)\nElectrical: 200-amp service, updated panel, all GFCI outlets present, code compliant\nHVAC: Furnace 8 years old (avg life 15-20 years), recently serviced, AC 6 years old, both functioning optimally\nAttic: R-38 insulation, adequate ventilation, no signs of moisture or pests\nCrawl Space: Vapor barrier installed, dry, no structural concerns\nWindows: Double-pane, all seals intact\nAppliances: All tested and functional\n\nRecommended Repairs: $450 total\nMaintenance Items: Regular HVAC service, gutter cleaning',
        quality: 98
      }
    ],
    'mortgage-pre-approval': [
      {
        content: 'Mortgage Pre-Approval Letter\n\nBorrower: Jane Doe\nLoan Amount: Up to $400,000\nInterest Rate: Current market rates\nLoan Type: Conventional\nValid: 90 days\n\nThis letter is subject to final underwriting approval.',
        quality: 55
      },
      {
        content: 'Mortgage Pre-Approval Letter\n\nBorrower: Jane Doe\nLoan Amount: Up to $400,000\nInterest Rate: 6.5% (rate lock available)\nLoan Type: Conventional 30-year fixed\nDown Payment: 20% ($80,000)\nValid: 90 days\nCredit Score: 750\nDebt-to-Income: 32%\n\nThis letter is subject to final underwriting approval and property appraisal.',
        quality: 82
      },
      {
        content: 'Mortgage Pre-Approval Letter\n\nBorrower: Jane Doe\nLoan Amount: Up to $400,000\n\nYou are pre-approved subject to conditions.',
        quality: 35
      },
      {
        content: 'Mortgage Pre-Approval Letter\n\nLender: ABC Mortgage Co. (NMLS #12345)\nLoan Officer: Michael Brown (NMLS #67890)\nBorrower: Jane Doe\nLoan Amount: Up to $400,000\nInterest Rate: 6.5% (rate lock available for 60 days)\nLoan Type: Conventional 30-year fixed\nDown Payment: 20% ($80,000 verified)\nValid Through: June 15, 2024 (90 days)\nCredit Score: 750 (Excellent)\nDebt-to-Income: 32% (Well qualified)\nEmployment: Verified, 5 years current employer\nAssets: Verified, sufficient reserves\n\nDocumentation Reviewed:\n- 2 years tax returns\n- 3 months pay stubs\n- 2 months bank statements\n- Credit report pulled\n\nThis pre-approval is based on full documentation review and is subject only to satisfactory property appraisal and final underwriting conditions. No additional financial information needed.',
        quality: 96
      }
    ],
    'closing-disclosure': [
      {
        content: 'Closing Disclosure\n\nLoan Amount: $320,000\nInterest Rate: 6.5%\nMonthly Payment: $2,023\nClosing Costs: $8,500\nCash to Close: $88,500\n\nEstimated Taxes: $3,600/year\nEstimated Insurance: $1,200/year',
        quality: 58
      },
      {
        content: 'Closing Disclosure\n\nLoan Amount: $320,000\nInterest Rate: 6.5%\nMonthly Payment: $2,023 (P&I)\nClosing Costs: $8,500 (itemized)\nCash to Close: $88,500\n\nItemized Closing Costs:\n- Origination Charges: $1,600\n- Title Services: $2,200\n- Government Fees: $850\n- Prepaid Items: $3,850\n\nEstimated Escrow:\nTaxes: $3,600/year ($300/month)\nInsurance: $1,200/year ($100/month)\n\nTotal Monthly: $2,423 (P&I + Escrow)',
        quality: 86
      },
      {
        content: 'Closing Disclosure\n\nLoan Amount: $320,000\nMonthly Payment: $2,023\nClosing Costs: $8,500\n\nPlease review before closing.',
        quality: 42
      },
      {
        content: 'Closing Disclosure (CD)\n\nIssued: 3 business days before closing\nLoan Amount: $320,000\nInterest Rate: 6.5% (fixed)\nAPR: 6.72%\nMonthly Principal & Interest: $2,023\nClosing Costs: $8,500 (Section H itemized below)\nCash to Close: $88,500\n\nSection A - Loan Costs:\n- Origination Charges: $1,600 (0.5%)\n- Points: $0\n- Underwriting Fee: $500\n\nSection B - Services You Cannot Shop For:\n- Appraisal: $650\n- Credit Report: $50\n- Flood Certification: $25\n\nSection C - Services You Can Shop For:\n- Title Search: $400\n- Title Insurance: $1,800\n- Settlement Fee: $500\n\nSection E - Taxes & Government Fees:\n- Recording Fees: $350\n- Transfer Tax: $500\n\nSection F - Prepaids:\n- Homeowners Insurance: $1,200 (12 months)\n- Property Taxes: $900 (3 months)\n- Prepaid Interest: $525\n\nSection G - Initial Escrow:\n- Property Taxes: $1,200 (4 months)\n- Homeowners Insurance: $300 (3 months)\n\nSection H - Other:\n- HOA Fees: $0\n\nProjected Payments:\nYears 1-30: $2,423/month\n- Principal & Interest: $2,023\n- Escrow (Taxes + Insurance): $400\n\nComparison to Loan Estimate:\n- Closing costs increased by $350 (within tolerance)\n- Interest rate: Same as locked\n\nRight to Cancel: You have 3 business days to review before closing.',
        quality: 99
      }
    ]
  };

  const generateDocuments = (docType: DocumentType): [Document, Document] => {
    const availableDocs = documentContent[docType];
    const shuffled = [...availableDocs].sort(() => Math.random() - 0.5);
    
    return [
      { id: '1', content: shuffled[0].content, quality: shuffled[0].quality },
      { id: '2', content: shuffled[1].content, quality: shuffled[1].quality }
    ];
  };

  const handleDocTypeSelect = (docType: DocumentType) => {
    setSelectedDocType(docType);
    const docs = generateDocuments(docType);
    setCurrentDocuments(docs);
    setWinner(null);
    setScore(0);
    setRound(1);
  };

  const handleDocumentSelect = (selectedDoc: Document) => {
    if (!currentDocuments) return;

    const otherDoc = currentDocuments.find(doc => doc.id !== selectedDoc.id);
    if (!otherDoc) return;

    const betterDoc = selectedDoc.quality > otherDoc.quality ? selectedDoc : otherDoc;
    const isCorrect = selectedDoc.id === betterDoc.id;

    if (isCorrect) {
      setScore(score + 1);
    }

    setWinner(betterDoc);

    setTimeout(() => {
      if (round < 5) {
        const newDocs = generateDocuments(selectedDocType!);
        setCurrentDocuments(newDocs);
        setWinner(null);
        setRound(round + 1);
      }
    }, 2500);
  };

  const handleReset = () => {
    setSelectedDocType(null);
    setCurrentDocuments(null);
    setWinner(null);
    setScore(0);
    setRound(1);
  };

  const handlePlayAgain = () => {
    if (selectedDocType) {
      const docs = generateDocuments(selectedDocType);
      setCurrentDocuments(docs);
      setWinner(null);
      setScore(0);
      setRound(1);
    }
  };

  if (!selectedDocType) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
            <RobotoFont className="text-3xl font-bold text-gray-900 mb-4">
              Document Comparison Game
            </RobotoFont>
            <RobotoFont className="text-gray-600 mb-6">
              Learn to identify high-quality homebuying documents by comparing them side-by-side. 
              Choose a document type to begin!
            </RobotoFont>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documentTypes.map((docType) => (
              <button
                key={docType.id}
                onClick={() => handleDocTypeSelect(docType.id)}
                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left border-2 border-transparent hover:border-blue-500"
              >
                <div className="text-4xl mb-4">{docType.icon}</div>
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
    );
  }

  if (round > 5) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <RobotoFont className="text-3xl font-bold text-gray-900 mb-4">
              Game Complete!
            </RobotoFont>
            <RobotoFont className="text-5xl font-bold text-blue-600 mb-4">
              {score} / 5
            </RobotoFont>
            <RobotoFont className="text-xl text-gray-600 mb-8">
              {score === 5 && "Perfect score! You're an expert at identifying quality documents!"}
              {score === 4 && "Excellent work! You have a great eye for detail!"}
              {score === 3 && "Good job! You're learning to spot the differences!"}
              {score < 3 && "Keep practicing! You'll get better at identifying quality documents!"}
            </RobotoFont>
            <div className="flex gap-4 justify-center">
              <button
                onClick={handlePlayAgain}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RobotoFont>Play Again</RobotoFont>
              </button>
              <button
                onClick={handleReset}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <RobotoFont>Choose Different Document</RobotoFont>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={handleReset}
          className="mb-6 text-blue-600 hover:text-blue-700 flex items-center gap-2"
        >
          <span>←</span>
          <RobotoFont>Back to Document Selection</RobotoFont>
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <RobotoFont className="text-2xl font-bold text-gray-900">
                {documentTypes.find(dt => dt.id === selectedDocType)?.title}
              </RobotoFont>
              <RobotoFont className="text-gray-600 mt-1">
                Round {round} of 5 • Score: {score}
              </RobotoFont>
            </div>
            <RobotoFont className="text-lg font-semibold text-blue-600">
              Choose the better document
            </RobotoFont>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {currentDocuments?.map((doc) => (
            <button
              key={doc.id}
              onClick={() => !winner && handleDocumentSelect(doc)}
              disabled={!!winner}
              className={`bg-white rounded-lg shadow-sm p-6 text-left transition-all ${
                !winner ? 'hover:shadow-md hover:border-blue-500 cursor-pointer' : 'cursor-not-allowed'
              } border-2 ${
                winner?.id === doc.id
                  ? 'border-green-500 bg-green-50'
                  : winner
                  ? 'border-gray-200 opacity-60'
                  : 'border-transparent'
              }`}
            >
              <RobotoFont className="whitespace-pre-wrap text-gray-800 font-mono text-sm">
                {doc.content}
              </RobotoFont>
              {winner?.id === doc.id && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <RobotoFont className="text-green-700 font-semibold">
                    ✓ Better Document (Quality: {doc.quality}%)
                  </RobotoFont>
                </div>
              )}
            </button>
          ))}
        </div>

        {winner && (
          <div className="mt-6 bg-white rounded-lg shadow-sm">
            <RobotoFont className="text-lg text-gray-700">
              <span className="font-semibold">Why this is better:</span> The selected document includes more comprehensive details, 
              specific numbers, itemization, and actionable information that helps you make informed decisions.
            </RobotoFont>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentComparisonGame;