import React, { useState, useEffect } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useModules } from '../../../hooks/useModules';
import { Module } from '../../../types/modules.backup';
import { CoinIcon, QuestionImage, BadgeMedal, RobotoFont } from '../../../assets';
import { FeedbackContainer, QuizResults } from '../../../components';
import { getLessonQuiz } from '../../../services/learningAPI';
import { useModule } from '../../../hooks/queries/useLearningQueries';

interface ModuleQuizViewProps {
  module: Module;
  onBack: () => void;
  isTransitioning?: boolean;
}

interface BackendQuizQuestion {
  id: string;
  lesson_id: string;
  question_text: string;
  question_type: string;
  explanation: string;
  order_index: number;
  answers: {
    id: string;
    question_id: string;
    answer_text: string;
    order_index: number;
  }[];
}

const ModuleQuizView: React.FC<ModuleQuizViewProps> = ({
  module,
  onBack,
  isTransitioning = false
}) => {
  const [isQuizBattleModalOpen, setIsQuizBattleModalOpen] = useState(false);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  const { data: backendModuleData, isLoading: isLoadingModule, error: moduleError } = useModule(module?.id || '');

  const {
    quizState,
    selectAnswer,
    nextQuestion,
    previousQuestion,
    resetQuiz,
    closeQuiz,
    completeModuleQuiz,
    sidebarCollapsed,
    toggleSidebar,
    startModuleQuiz
  } = useModules();

  useEffect(() => {
    const initializeModuleQuiz = async () => {
      if (quizState.isActive && quizState.quizType === 'module') return;

      setIsLoadingQuiz(true);
      
      try {
        const allQuizQuestions: any[] = [];
        
        for (const lesson of module.lessons) {
          try {
            const lessonQuizData = await getLessonQuiz(lesson.id.toString());
            console.log(`Quiz data for lesson ${lesson.id}:`, lessonQuizData);
            
            if (lessonQuizData && lessonQuizData.length > 0) {
              allQuizQuestions.push(lessonQuizData[0]); // Take first question from each lesson
            }
          } catch (error) {
            console.error(`Error fetching quiz for lesson ${lesson.id}:`, error);
          }
        }

        console.log('Total quiz questions collected:', allQuizQuestions.length);

        if (allQuizQuestions.length > 0) {
          const transformedQuestions = allQuizQuestions.map((q: BackendQuizQuestion, index: number) => {
            const sortedAnswers = [...q.answers].sort((a, b) => a.order_index - b.order_index);
            
            return {
              id: index + 1,
              question: q.question_text,
              options: sortedAnswers.map((answer, answerIndex) => ({
                id: String.fromCharCode(97 + answerIndex), // 'a', 'b', 'c', 'd'
                text: answer.answer_text,
                isCorrect: answerIndex === 0 // Backend puts correct answer first
              })),
              explanation: {
                correct: q.explanation || "Correct! Well done.",
                incorrect: sortedAnswers.reduce((acc, _answer, answerIndex) => {
                  if (answerIndex > 0) {
                    const optionId = String.fromCharCode(97 + answerIndex);
                    acc[optionId] = {
                      why_wrong: `This is not the correct answer.`,
                      confusion_reason: `Review the lesson content for more details.`
                    };
                  }
                  return acc;
                }, {} as { [key: string]: { why_wrong: string; confusion_reason: string } })
              }
            };
          });

          startModuleQuiz(transformedQuestions, module.id);
        } else {
          throw new Error('No quiz questions available for this module');
        }
      } catch (error) {
        console.error('Error initializing module quiz:', error);
        console.log('Failed to load quiz. Using sample questions.');

        // Fallback to sample questions
        const sampleModuleQuizQuestions = [
          {
            id: 1,
            question: "What is the main goal of this module?",
            options: [
              { id: 'a', text: "To learn basic concepts", isCorrect: true },
              { id: 'b', text: "To complete assignments", isCorrect: false },
              { id: 'c', text: "To earn coins", isCorrect: false },
              { id: 'd', text: "To watch videos", isCorrect: false }
            ],
            explanation: {
              correct: "Great! The main goal is to understand and apply the core concepts taught in this module.",
              incorrect: {
                'a': { why_wrong: "This is actually correct.", confusion_reason: "Correct answer" },
                'b': { why_wrong: "While assignments help, the main goal is conceptual understanding.", confusion_reason: "Common misconception about learning objectives" },
                'c': { why_wrong: "Coins are rewards, not the primary learning objective.", confusion_reason: "Gamification elements vs core purpose" },
                'd': { why_wrong: "Videos are just one delivery method for the content.", confusion_reason: "Medium vs message confusion" }
              }
            }
          },
          {
            id: 2,
            question: "Which of the following represents best practices covered in this module?",
            options: [
              { id: 'a', text: "Following step-by-step procedures", isCorrect: false },
              { id: 'b', text: "Understanding underlying principles", isCorrect: true },
              { id: 'c', text: "Memorizing facts", isCorrect: false },
              { id: 'd', text: "Completing tasks quickly", isCorrect: false }
            ],
            explanation: {
              correct: "Excellent! Understanding principles allows you to apply knowledge flexibly.",
              incorrect: {
                'a': { why_wrong: "Procedures are helpful but understanding principles is more important.", confusion_reason: "Surface vs deep learning approach" },
                'b': { why_wrong: "This is actually correct.", confusion_reason: "Correct answer" },
                'c': { why_wrong: "Memorization without understanding limits practical application.", confusion_reason: "Rote learning vs comprehension" },
                'd': { why_wrong: "Speed without comprehension can lead to errors.", confusion_reason: "Quality vs quantity" }
              }
            }
          },
          {
            id: 3,
            question: "How should you apply the knowledge from this module?",
            options: [
              { id: 'a', text: "Only in specific situations", isCorrect: false },
              { id: 'b', text: "By following exact examples", isCorrect: false },
              { id: 'c', text: "By adapting to different contexts", isCorrect: true },
              { id: 'd', text: "Without thinking critically", isCorrect: false }
            ],
            explanation: {
              correct: "Perfect! The best learning happens when you can adapt knowledge to new situations.",
              incorrect: {
                'a': { why_wrong: "Knowledge should be transferable to multiple situations.", confusion_reason: "Limited thinking about application" },
                'b': { why_wrong: "Examples are guides, not rigid templates.", confusion_reason: "Rigid vs flexible thinking" },
                'c': { why_wrong: "This is actually correct.", confusion_reason: "Correct answer" },
                'd': { why_wrong: "Critical thinking is essential for proper application.", confusion_reason: "Passive vs active learning" }
              }
            }
          }
        ];

        startModuleQuiz(sampleModuleQuizQuestions, module.id);
      } finally {
        setIsLoadingQuiz(false);
      }
    };

    initializeModuleQuiz();
  }, [module?.id, module.lessons]);

  const handleAnswerSelect = (optionId: string) => {
    if (quizState.isTransitioning) return;
    selectAnswer(quizState.currentQuestion, optionId);
  };

  const handleNext = () => {
    if (quizState.isTransitioning || !quizState.selectedAnswer) return;
    nextQuestion();
  };

  const handlePrevious = () => {
    if (quizState.isTransitioning || quizState.currentQuestion === 0) return;
    previousQuestion();
  };

  const handleFinish = () => {
    completeModuleQuiz(module.id, quizState.score);
    closeQuiz();
    onBack();
  };

  const handleRetake = () => {
    resetQuiz();
  };

  const handleClaimRewards = () => {
    console.log('Claiming module completion rewards for score:', quizState.score);
    handleFinish();
  };

  const handleBack = () => {
    if (isTransitioning) return;
    closeQuiz();
    onBack();
  };

  const toggleModuleInfo = () => {
    if (isTransitioning) return;
    toggleSidebar(!sidebarCollapsed);
  };

  const currentQuestionData = quizState.questions[quizState.currentQuestion];
  const showFeedback = !!quizState.selectedAnswer;

  const isCompleted = module.status === 'Completed';
  const moduleQuizCompleted = module.quizCompleted || false;
  const moduleQuizScore = module.quizScore || 0;

  const correctAnswers = quizState.questions.reduce((acc, question, index) => {
    const userAnswer = quizState.answers[index];
    const correctOption = question.options.find(opt => opt.isCorrect);
    return acc + (userAnswer === correctOption?.id ? 1 : 0);
  }, 0);

  // Use backend data when available, fallback to prop data
  const displayTitle = backendModuleData?.title || module.title;
  const displayDescription = backendModuleData?.description || module.description;
  const displayImage = backendModuleData?.thumbnail_url || module.image;
  const displayLessonCount = backendModuleData?.lesson_count || module.lessonCount;

  // Question Component
  const QuestionCard: React.FC<{
    questionData: any;
    selectedAnswer?: string | null;
    showFeedback?: boolean;
    isCurrentQuestion?: boolean;
  }> = ({ questionData, selectedAnswer = null, showFeedback: cardShowFeedback = false, isCurrentQuestion = false }) => {
    
    const cardCorrectAnswer = questionData?.options.find((opt: any) => opt.isCorrect);
    const isCorrect = selectedAnswer === cardCorrectAnswer?.id;

    return (
      <>
        {/* Question Content */}
        <div className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full">
          {/* Illustration */}
          <div className="mb-6 relative">
            <img 
              src={QuestionImage} 
              alt="Question Illustration" 
              className="w-48 h-48 object-cover rounded-2xl p-3" 
            />
          </div>

          {/* Question */}
          <div className="text-center mb-6 flex-shrink-0">
            <RobotoFont as="h2" weight={600} className="text-lg text-gray-900 mb-3 leading-tight px-2">
              {questionData?.question}
            </RobotoFont>
          </div>

          {/* Answer Options */}
         {/* Answer Options with Feedback Overlay */}
          <div className="relative w-full mb-4 flex-shrink-0">
            <div className="grid grid-cols-2 gap-3 w-full">
              {questionData?.options.map((option: any) => {
                const isSelected = isCurrentQuestion && selectedAnswer === option.id;
                const isOptionCorrect = option.isCorrect;
                const showResult = cardShowFeedback && isSelected;
                
                let buttonStyle = {
                  backgroundColor: '#D7DEFF',
                  color: '#3F6CB9'
                };
                
                if (showResult) {
                  if (isOptionCorrect) {
                    buttonStyle = {
                      backgroundColor: '#4BD48B',
                      color: '#FFFFFF'
                    };
                  } else {
                    buttonStyle = {
                      backgroundColor: '#F1746D',
                      color: '#FFFFFF'
                    };
                  }
                } else if (isSelected) {
                  buttonStyle = {
                    backgroundColor: '#ECFFF5',
                    color: '#3F6CB9'
                  };
                }
                
                return (
                  <button
                    key={option.id}
                    onClick={() => isCurrentQuestion && handleAnswerSelect(option.id)}
                    disabled={!isCurrentQuestion || cardShowFeedback || quizState.isTransitioning}
                    style={buttonStyle}
                    className={`p-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:cursor-not-allowed shadow-sm ${
                      isSelected ? 'ring-2 ring-white ring-opacity-50 scale-105' : ''
                    } ${!isCurrentQuestion ? 'opacity-75' : ''}`}
                  >
                    <RobotoFont weight={500} className="text-sm text-center leading-tight">
                      {option.text}
                    </RobotoFont>
                  </button>
                );
              })}
            </div>

            {/* Feedback Overlay */}
            <FeedbackContainer
              isVisible={cardShowFeedback && !!selectedAnswer}
              isCorrect={isCorrect}
              correctMessage={questionData?.explanation?.correct || ''}
              incorrectMessage={(selectedAnswer && questionData?.explanation?.incorrect?.[selectedAnswer]?.why_wrong) || 'Please try again!'}
            />
          </div>
        </div>
      </>
    );
  };

  // Show loading state while quiz is being initialized
  if (isLoadingQuiz) {
    return (
      <div className="pt-6 w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
          <RobotoFont className="text-gray-600">Loading module quiz...</RobotoFont>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-6 w-full h-full">
      <div className="flex h-full w-full">
        {/* Arrow Toggle */}
        <button
          onClick={toggleModuleInfo}
          disabled={isTransitioning}
          className={`relative z-10 w-4 h-12 bg-white border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex-shrink-0`}
          style={{
            top: '240px'
          }}
        >
          <svg 
            className={`w-3 h-3 text-gray-600 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Left Column - Module Info */}
        <div className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-[30%] opacity-100'
        }`}>
          <div 
            className="h-full px-2 flex flex-col overflow-y-auto" 
            style={{ 
              scrollbarWidth: 'none', 
              msOverflowStyle: 'none'
            }}
          >
            {/* Top Fixed Content */}
            <div className="flex-shrink-0">
              {/* Back Button and Quiz Status Row */}
              <div className="pb-2 flex items-center justify-between gap-2 min-w-0">
                <button
                  onClick={handleBack}
                  disabled={isTransitioning}
                  className="flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex-shrink-0"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <RobotoFont weight={500} className="text-blue-600 whitespace-nowrap">
                    Back to Module Library
                  </RobotoFont>
                </button>

                {/* Module Quiz Status */}
                {moduleQuizCompleted && (
                <div className="flex items-center gap-2 bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex-shrink-0 min-w-0">
                    {moduleQuizScore > 0 && quizState.questions.length > 0 && (
                    <RobotoFont weight={500} className="text-xs px-2 py-0.5 whitespace-nowrap flex-shrink-0">
                        {Math.round((moduleQuizScore / quizState.questions.length) * 100)}%
                      </RobotoFont>
                    )}
                  </div>
                )}
              </div>

              {/* Module Header */}
              <div className="space-y-3 pb-3">
                <div>
                  <RobotoFont as="h1" weight={700} className="text-xl text-gray-900 mb-1 leading-tight">
                    {displayTitle}
                  </RobotoFont>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex gap-1">
                      {module.tags.map((tag) => (
                        <span 
                          key={tag}
                          className={`px-1.5 py-0.5 text-xs rounded-full ${
                            tag === 'Beginner' 
                              ? 'bg-blue-100 text-blue-700' 
                              : tag === 'Finance'
                              ? 'bg-green-100 text-green-700'
                              : tag === 'Intermediate'
                              ? 'bg-purple-100 text-purple-700'
                              : tag === 'Process'
                              ? 'bg-orange-100 text-orange-700'
                              : tag === 'Maintenance'
                              ? 'bg-red-100 text-red-700'
                              : tag === 'Safety'
                              ? 'bg-yellow-100 text-yellow-700'
                              : tag === 'Technology'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          <RobotoFont weight={500}>
                            {tag}
                          </RobotoFont>
                        </span>
                      ))}
                    </div>
                    <RobotoFont className="text-xs text-gray-600">
                      {displayLessonCount} lessons
                    </RobotoFont>
                  </div>
                </div>
              </div>

              {/* Loading/Error State */}
              {isLoadingModule && (
                <div className="text-xs text-gray-500 pb-2">
                  <RobotoFont className="text-xs">Loading module details...</RobotoFont>
                </div>
              )}
              {moduleError && (
                <div className="text-xs text-orange-500 pb-2">
                  <RobotoFont className="text-xs">
                    {moduleError instanceof Error ? moduleError.message : 'Failed to load module'}
                  </RobotoFont>
                </div>
              )}
            </div>

            <div className="flex-1 flex items-center justify-center">
              <div 
                className="bg-gradient-to-br from-blue-50 to-blue-50 rounded-lg w-full transition-all duration-700 ease-in-out overflow-hidden"
                style={{ 
                  height: 'min(calc(100vh - 550px), 300px)',
                  minHeight: '120px'
                }}
              >
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                  <img src={displayImage} alt={displayTitle} className="object-contain w-full h-full" />

                  {/* Completion badge from Redux */}
                  {isCompleted && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 py-3 border-t border-gray-100 space-y-3">
              <div className="text-xs text-gray-600">
                <RobotoFont className="text-xs text-gray-600">
                  {displayDescription || "In this module, you'll learn about the precursor steps to prepare for home ownership."}
                </RobotoFont>
              </div>

              <div className="text-xs text-gray-600">
                <RobotoFont className="text-xs text-gray-600">
                  Complete the Module quiz to get your rewards. Test your skills against another player to win more.
                </RobotoFont>
              </div>

              {/* Rewards Section with Remaining Coins and Badge Status */}
              <div className="space-y-3 pb-4">
                <RobotoFont as="h3" weight={500} className="text-sm text-gray-900">
                  Rewards
                </RobotoFont>
                <div className="flex gap-2">
                  <div className="flex items-center gap-2 bg-yellow-50 px-3 py-2 rounded-lg flex-1">
                    <img src={CoinIcon} alt="Coins" className="w-6 h-6" />
                    <RobotoFont weight={500} className="text-xs text-gray-900">
                      {(() => {
                        // Calculate remaining coins that can be earned
                        const totalQuestions = quizState.questions.length; // Use actual quiz length
                        const maxCoinsForModule = totalQuestions * 10; // 10 coins per question for module quiz
                        const currentCorrectAnswers = moduleQuizScore || 0;
                        const coinsAlreadyEarned = currentCorrectAnswers * 10;
                        const remainingCoins = maxCoinsForModule - coinsAlreadyEarned;
                        
                        return `+${remainingCoins} NestCoins`;
                      })()}
                    </RobotoFont>
                  </div>
                  <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg flex-1">
                    {(() => {
                      const totalQuestions = quizState.questions.length;
                      const currentCorrectAnswers = moduleQuizScore || 0;
                      const hasEarnedBadge = currentCorrectAnswers === totalQuestions;
                      
                      return (
                        <img 
                          src={BadgeMedal} 
                          alt="Badge" 
                          className={`w-7 h-7 transition-all duration-300 ${
                            hasEarnedBadge ? 'opacity-100' : 'opacity-100 brightness-0'
                          }`}
                        />
                      );
                    })()}
                    <RobotoFont weight={500} className="text-xs text-gray-900">
                      Module Badge
                    </RobotoFont>
                  </div>
                </div>
              </div>

              {/* Get More Rewards Section */}
              <div className="space-y-3">
                <RobotoFont as="h3" weight={500} className="text-sm text-gray-900">
                  Get More Rewards
                </RobotoFont>
                <div className="text-xs text-gray-600 space-y-1">
                  <RobotoFont className="text-xs text-gray-600">
                    Earn Coins, Challenge players, make the leaderboard.
                  </RobotoFont>
                  <RobotoFont className="text-xs text-gray-600">
                    Battle against each other for more rewards.
                  </RobotoFont>
                </div>
                <button
                  onClick={() => setIsQuizBattleModalOpen(true)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <RobotoFont weight={500} className="text-white">
                    Quiz Battle
                  </RobotoFont>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Separator Line */}
        <div className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-0' : 'w-px bg-gray-200 mx-2'
        }`} />

        {/* Right Column - Quiz Content */}
        <div className={`transition-all duration-300 ease-in-out relative overflow-hidden ${
          sidebarCollapsed ? 'w-[80%] mx-auto' : 'w-[calc(70%-1rem)]'
        }`}>
          <div className="p-4 h-full flex flex-col relative">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div className="text-left flex-1 ml-4">
                <RobotoFont as="h1" weight={600} className="text-sm text-gray-900">
                  Test Your Knowledge
                </RobotoFont>
                <RobotoFont className="text-xs text-gray-600">
                  Question {quizState.currentQuestion + 1} out of {quizState.questions.length}
                </RobotoFont>
              </div>
              <div className="w-6"></div>
            </div>

            {!quizState.showResults ? (
              <>
                <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
                  <div className="relative h-full w-full overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-full transition-all duration-500 ease-in-out ${
                        quizState.isTransitioning
                          ? 'opacity-0 transform scale-95'
                          : 'opacity-100 transform scale-100'
                      }`}
                      style={{ 
                        pointerEvents: quizState.isTransitioning ? 'none' : 'auto'
                      }}
                    >
                      <div className="h-full flex flex-col relative">
                        <QuestionCard
                          questionData={currentQuestionData}
                          selectedAnswer={quizState.selectedAnswer}
                          showFeedback={showFeedback}
                          isCurrentQuestion={true}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center flex-shrink-0 mt-2">
                  <button
                    onClick={handlePrevious}
                    disabled={quizState.currentQuestion === 0 || quizState.isTransitioning}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RobotoFont weight={500}>
                      Previous
                    </RobotoFont>
                  </button>
                  
                  <div className="flex gap-1">
                    {quizState.questions.map((_q, index) => (
                      <div
                        key={index}
                        className={`w-1.5 h-1.5 rounded-full transition-colors ${
                          index === quizState.currentQuestion 
                            ? 'bg-blue-600' 
                            : index < quizState.currentQuestion 
                              ? 'bg-green-500' 
                              : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={handleNext}
                    disabled={!quizState.selectedAnswer || quizState.isTransitioning}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RobotoFont weight={500} className="text-white">
                      {quizState.currentQuestion === quizState.questions.length - 1 ? 'Finish' : 'Next'}
                    </RobotoFont>
                  </button>
                </div>
              </>
            ) : (
              /* QuizResults component with module quiz props */
              <QuizResults
                score={quizState.score}
                totalQuestions={quizState.questions.length}
                correctAnswers={correctAnswers}
                onContinue={handleFinish}
                onRetake={handleRetake}
                onClaimRewards={handleClaimRewards}
                lessonTitle={`${displayTitle} - Module Quiz`}
                nextLesson={null}
                isModuleQuiz={true}
                moduleId={module.id}
              />
            )}
          </div>
        </div>
      </div>

      {/* Quiz Battle Development Modal */}
      <Dialog 
        open={isQuizBattleModalOpen} 
        onClose={() => setIsQuizBattleModalOpen(false)}
        className="relative z-50"
      >
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/25" aria-hidden="true" />
        
        {/* Full-screen container to center the panel */}
        <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
          <DialogPanel className="mx-auto max-w-sm rounded-xl bg-white p-6 shadow-lg">
            <DialogTitle>
              <RobotoFont weight={600} className="text-lg text-gray-900 mb-4">
                Quiz Battles
              </RobotoFont>
            </DialogTitle>
            
            <div className="mb-6">
              <RobotoFont className="text-gray-600 text-sm">
                Quiz Battles are currently in development! 🚀
              </RobotoFont>
              <RobotoFont className="text-gray-600 text-sm mt-2">
                We're working hard to bring you an exciting multiplayer quiz experience. Check back soon!
              </RobotoFont>
            </div>
            
            <button
              onClick={() => setIsQuizBattleModalOpen(false)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <RobotoFont weight={500} className="text-white">
                Got it!
              </RobotoFont>
            </button>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
};

export default ModuleQuizView;