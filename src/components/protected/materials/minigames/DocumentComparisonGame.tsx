import React, { useState, useEffect, useRef } from 'react';
import { documentContent, DocumentType, DifficultyLevel } from './documentData';

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
  const [hasOverflow, setHasOverflow] = useState<{ [key: string]: boolean }>({});
  const [scrollProgress, setScrollProgress] = useState<{ [key: string]: number }>({});
  const docRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const explanationRef = useRef<HTMLDivElement | null>(null);

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

  const difficultyConfig: Record<DifficultyLevel, { multiplier: number; label: string; color: string; description: string }> = {
    easy: { multiplier: 1, label: 'Easy', color: 'bg-green-500', description: 'Obvious differences' },
    medium: { multiplier: 1.5, label: 'Medium', color: 'bg-yellow-500', description: 'Some subtlety' },
    hard: { multiplier: 2, label: 'Hard', color: 'bg-orange-500', description: 'Careful reading needed' }
  };

  useEffect(() => {
    if (currentDocuments && !winner) {
      setStartTime(Date.now());
    }
  }, [currentDocuments, winner]);

  useEffect(() => {
    // Check for overflow on document containers and reset scroll position
    if (currentDocuments) {
      currentDocuments.forEach(doc => {
        const element = docRefs.current[doc.id];
        if (element) {
          // Reset scroll position to top
          element.scrollTop = 0;
          
          const hasScroll = element.scrollHeight > element.clientHeight;
          setHasOverflow(prev => ({ ...prev, [doc.id]: hasScroll }));
        }
      });
    }
  }, [currentDocuments]);

  const handleDocumentScroll = (docId: string) => {
    const element = docRefs.current[docId];
    if (element) {
      const scrollPercentage = (element.scrollTop / (element.scrollHeight - element.clientHeight)) * 100;
      setScrollProgress(prev => ({ ...prev, [docId]: scrollPercentage }));
    }
  };

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
    setHasOverflow({});
    setScrollProgress({});
  };

  const handleDocumentSelect = (selectedDoc: Document) => {
    if (!currentDocuments || !startTime) return;

    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    setRoundTimes([...roundTimes, timeTaken]);

    const otherDoc = currentDocuments.find(doc => doc.id !== selectedDoc.id);
    if (!otherDoc) return;

    const betterDoc = selectedDoc.quality > otherDoc.quality ? selectedDoc : otherDoc;
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
    } else {
      setStreak(0);
    }

    setWinner(betterDoc);
    setShowExplanation(true);
    
    // Scroll to explanation after a short delay
    setTimeout(() => {
      explanationRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleContinue = () => {
    if (selectedDocType) {
      const nextRound = round + 1;
      setRound(nextRound);
      
      if (nextRound <= 5) {
        const newDocs = generateDocuments(selectedDocType, difficulty);
        setCurrentDocuments(newDocs);
        setWinner(null);
        setShowExplanation(false);
        setStartTime(null);
        setHasOverflow({});
        setScrollProgress({});
      }
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
    setHasOverflow({});
    setScrollProgress({});
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
      setHasOverflow({});
      setScrollProgress({});
    }
  };

  if (!selectedDocType) {
    return (
      <div className="min-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <RobotoFont className="text-4xl font-bold text-gray-900 mb-4">
              📚 Document Comparison Game
            </RobotoFont>
            <RobotoFont className="text-lg text-gray-600 mb-6">
              Learn to identify high-quality homebuying documents through comparison. Earn points, unlock new document types, and build your knowledge!
            </RobotoFont>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-600 rounded-xl p-4 text-white">
                <RobotoFont className="text-sm opacity-90">Total Score</RobotoFont>
                <RobotoFont className="text-3xl font-bold">{totalScore}</RobotoFont>
              </div>
              <div className="bg-purple-600 rounded-xl p-4 text-white">
                <RobotoFont className="text-sm opacity-90">Best Streak</RobotoFont>
                <RobotoFont className="text-3xl font-bold">{bestStreak} 🔥</RobotoFont>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <RobotoFont className="text-xl font-bold text-gray-900 mb-4">
              Select Difficulty
            </RobotoFont>
            <div className="grid grid-cols-3 gap-4">
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
                  onClick={() => handleDocTypeSelect(docType.id)}
                  className="p-6 rounded-xl border-2 text-left transition-all bg-white border-gray-300 hover:border-blue-500 hover:shadow-lg cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-4xl">{docType.icon}</div>
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
      <div className="max-h-screen overflow-hidden flex items-center justify-center py-4">
        <div className="max-w-3xl w-full px-4">
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 text-center">
            <div className="text-4xl sm:text-5xl mb-2">
              {score === 5 ? '🎉' : score >= 4 ? '🌟' : score >= 3 ? '👍' : '📚'}
            </div>
            <RobotoFont className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Round Complete!
            </RobotoFont>
            
            <div className="bg-blue-600 rounded-xl p-3 sm:p-4 mb-3 text-white">
              <RobotoFont className="text-4xl sm:text-5xl font-bold mb-1">
                {score} / 5
              </RobotoFont>
              <RobotoFont className="text-sm sm:text-lg opacity-90">
                {score === 5 && "Perfect! You're an expert at identifying quality documents!"}
                {score === 4 && "Excellent! You have a great eye for detail!"}
                {score === 3 && "Good job! You're learning the key differences!"}
                {score < 3 && "Keep practicing! Review the explanations to improve!"}
              </RobotoFont>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
              <div className="bg-blue-50 rounded-xl p-2 sm:p-3">
                <RobotoFont className="text-xs text-gray-600 mb-1">Avg Time</RobotoFont>
                <RobotoFont className="text-lg sm:text-xl font-bold text-blue-600">{avgTime}s</RobotoFont>
              </div>
              <div className="bg-purple-50 rounded-xl p-2 sm:p-3">
                <RobotoFont className="text-xs text-gray-600 mb-1">Best Streak</RobotoFont>
                <RobotoFont className="text-lg sm:text-xl font-bold text-purple-600">{bestStreak} 🔥</RobotoFont>
              </div>
              <div className="bg-green-50 rounded-xl p-2 sm:p-3">
                <RobotoFont className="text-xs text-gray-600 mb-1">Points Earned</RobotoFont>
                <RobotoFont className="text-lg sm:text-xl font-bold text-green-600">+{totalScore}</RobotoFont>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
              <button
                onClick={handlePlayAgain}
                className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-sm sm:text-base hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                <RobotoFont>▶ Play Again</RobotoFont>
              </button>
              <button
                onClick={handleReset}
                className="bg-white text-gray-700 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-bold text-sm sm:text-base border-2 border-gray-300 hover:border-gray-400 transition-all"
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
    <div className="min-h-screen">
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
              <div className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold">
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
            const showMoreIndicator = hasOverflow[doc.id] && (!scrollProgress[doc.id] || scrollProgress[doc.id] < 95);
            
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
                
                <div className="relative">
                  <div 
                    ref={(el) => { docRefs.current[doc.id] = el; }}
                    onScroll={() => handleDocumentScroll(doc.id)}
                    className="bg-gray-50 rounded-xl p-4 mb-4 max-h-[400px] overflow-y-auto font-mono text-sm whitespace-pre-wrap"
                    style={{
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none'
                    } as React.CSSProperties}
                  >
                    {doc.content}
                  </div>
                  
                  {/* Fade gradient overlay at bottom */}
                  {hasOverflow[doc.id] && (
                    <div 
                      className={`absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-gray-50 via-gray-50/90 to-transparent rounded-b-xl pointer-events-none transition-opacity duration-300 ${
                        scrollProgress[doc.id] && scrollProgress[doc.id] > 95 ? 'opacity-0' : 'opacity-100'
                      }`}
                    />
                  )}
                  
                  {/* Scroll indicator */}
                  {showMoreIndicator && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold animate-bounce pointer-events-none">
                      <RobotoFont className="flex items-center gap-1">
                        <span>↓</span> Scroll for more
                      </RobotoFont>
                    </div>
                  )}
                  
                  {/* Progress indicator on the side */}
                  {hasOverflow[doc.id] && (
                    <div className="absolute right-2 top-4 bottom-4 w-1 bg-gray-200 rounded-full">
                      <div 
                        className="w-full bg-blue-500 rounded-full transition-all duration-300"
                        style={{ height: `${scrollProgress[doc.id] || 0}%` }}
                      />
                    </div>
                  )}
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
          <div ref={explanationRef} className="mt-6 bg-white rounded-2xl shadow-lg p-6">
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
              className="mt-6 w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg"
            >
              <RobotoFont>Continue to Next Round →</RobotoFont>
            </button>
          </div>
        )}
      </div>
      
      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        .overflow-y-auto::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .overflow-y-auto {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
};

export default DocumentComparisonGame;