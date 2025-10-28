import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../../store/store';
import { openOnboardingModal, closeOnboardingModal } from '../../../store/slices/uiSlice';
import { getOnboardingStatus } from '../../../services/onBoardingAPI';
import OnBoardingPage from '../../../components/protected/onboarding/OnBoardingPage';
import { RobotoFont } from "../../../assets";
import {
  WelcomeCard,
  LessonCard,
  LeaderboardCard,
  SupportCard,
} from "./components";
import {
  Task,
  Lesson,
  LeaderboardEntry,
  SupportCard as SupportCardType,
} from "./types/overview.types";

const OverviewPage: React.FC = () => {
  const dispatch = useDispatch();
  const showOnboarding = useSelector((state: RootState) => state.ui.showOnboardingModal);
  const [isWelcomeExpanded, setIsWelcomeExpanded] = useState(true);

  // Mock data - TODO: Replace with API calls
  const [tasks] = useState<Task[]>([
    {
      id: "1",
      title: "Setup your Profile",
      icon: "src/assets/images/icons/blue-generic-avatar-icon.svg",
      points: 100,
      completed: true,
    },
    {
      id: "2",
      title: "Complete your Financial Profile (WIP!)",
      icon: "src/assets/images/icons/blue-generic-avatar-icon.svg",
      points: 100,
      completed: false,
      isWIP: true,
    },
  ]);

  const [continueLesson] = useState<Lesson>({
    id: "lesson-1",
    moduleNumber: 1,
    title: "Mindset & Financial Readiness",
    duration: "20 minutes",
    description:
      "Get your head in the game—and your wallet in shape—before you shop for your dream home.",
    points: 25,
    moduleTitle: "Readiness & Decision-Making Module",
    imageUrl: "src/assets/images/static/overview_img1.png",
    status: "continue",
  });

  const [learningModules] = useState<Lesson[]>([
    {
      id: "module-1",
      moduleNumber: 1,
      title: "Mindset & Financial Readiness",
      lessonsCount: 3,
      description:
        "What are the key financial steps & requirements to prepare for purchasing a home?",
      points: 100,
      moduleTitle: "",
      tags: ["Beginner", "Finance"],
      imageUrl: "src/assets/images/static/overview_img2.png",
      status: "start",
    },
  ]);

  const [leaderboard] = useState<LeaderboardEntry[]>([
    {
      id: "1",
      name: "Brandon B.",
      avatar: "src/assets/images/icons/generic-avatar-icon.svg",
      coins: 302,
      rank: 1,
    },
    {
      id: "2",
      name: "Brandon B.",
      avatar: "src/assets/images/icons/generic-avatar-icon.svg",
      coins: 302,
      rank: 2,
    },
    {
      id: "3",
      name: "Brandon B.",
      avatar: "src/assets/images/icons/generic-avatar-icon.svg",
      coins: 302,
      rank: 3,
    },
    {
      id: "4",
      name: "Brandon B.",
      avatar: "src/assets/images/icons/generic-avatar-icon.svg",
      coins: 302,
      rank: 4,
    },
  ]);

  // Handle various card actions
  const handleStartLesson = (lessonId: string) => {
    console.log("Starting lesson:", lessonId);
    // TODO: Navigate to lesson or implement lesson start logic
  };

  const handleContinueLesson = (lessonId: string) => {
    console.log("Continuing lesson:", lessonId);
    // TODO: Navigate to lesson or implement lesson continue logic
  };

  const handleLeaderboardMenu = () => {
    console.log("Leaderboard menu clicked");
    // TODO: Implement leaderboard menu logic
  };

  const handleSupportCardAction = (action: string) => {
    console.log("Support card action:", action);
    // TODO: Implement support card actions
  };

  const handleRewardsShop = () => {
    console.log("Rewards shop clicked");
    // TODO: Navigate to rewards shop
  };

  const [supportCards] = useState<SupportCardType[]>([
    {
      id: "1",
      title: "Talk to Our Expert",
      subtitle: "Schedule a call with our real estate expert to get personalized guidance.",
      icon: "src/assets/images/icons/chat-icon.svg",
      action: () => handleSupportCardAction("schedule_call"),
    },
    {
      id: "2",
      title: "How to Access Your Loan",
      subtitle: "Learn about different loan types and how to access them.",
      icon: "src/assets/images/icons/money-icon.svg",
      action: () => handleSupportCardAction("learn_loans"),
    },
  ]);

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboardingAndShowModal = async () => {
      try {
        const status = await getOnboardingStatus();
        
        // If onboarding is not completed, show the modal automatically
        if (!status.completed) {
          console.log('OverviewPage: Onboarding not completed, showing modal');
          dispatch(openOnboardingModal());
        }
      } catch (error) {
        console.error('OverviewPage: Error checking onboarding status:', error);
        // If there's an error (likely 400 meaning onboarding required), show modal
        dispatch(openOnboardingModal());
      }
    };

    // Only check if modal is not already shown
    if (!showOnboarding) {
      checkOnboardingAndShowModal();
    }
  }, [dispatch, showOnboarding]);

  // Handle onboarding modal close
  const handleCloseOnboarding = () => {
    dispatch(closeOnboardingModal());
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Page Header */}
          <div className="mb-8">
            <RobotoFont
              as="h1"
              weight={700}
              className="text-3xl font-bold text-gray-900 mb-2"
            >
              Welcome Back!
            </RobotoFont>
            <RobotoFont
              as="p"
              weight={400}
              className="text-gray-600"
            >
              Continue your journey to homeownership
            </RobotoFont>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-8 space-y-6">
              {/* Welcome Card */}
              <WelcomeCard
                tasks={tasks}
                isExpanded={isWelcomeExpanded}
                onToggleExpand={() => setIsWelcomeExpanded(!isWelcomeExpanded)}
              />

              {/* Continue Learning Section */}
              {continueLesson && (
                <div>
                  <RobotoFont
                    as="h2"
                    weight={600}
                    className="text-xl font-semibold text-gray-900 mb-4"
                  >
                    Continue Learning
                  </RobotoFont>
                  <LessonCard
                    lesson={continueLesson}
                    onAction={handleContinueLesson}
                  />
                </div>
              )}

              {/* Learning Modules Section */}
              <div>
                <RobotoFont
                  as="h2"
                  weight={600}
                  className="text-xl font-semibold text-gray-900 mb-4"
                >
                  Learning Modules
                </RobotoFont>
                <div className="space-y-4">
                  {learningModules.map((module) => (
                    <LessonCard
                      key={module.id}
                      lesson={module}
                      onAction={handleStartLesson}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* Rewards Card */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white relative overflow-hidden">
                {/* Content */}
                <div className="relative z-10">
                  <RobotoFont
                    as="h2"
                    weight={500}
                    className="text-white mb-3 text-2xl sm:text-3xl font-medium leading-tight"
                  >
                    Learn.
                  </RobotoFont>
                  <RobotoFont
                    as="h2"
                    weight={500}
                    className="text-white mb-3 text-2xl sm:text-3xl font-medium leading-tight"
                  >
                    Earn.
                  </RobotoFont>
                  <RobotoFont
                    as="h2"
                    weight={500}
                    className="text-white mb-3 text-2xl sm:text-3xl font-medium leading-tight"
                  >
                    Get Rewards.
                  </RobotoFont>
                  <RobotoFont
                    as="p"
                    weight={400}
                    className="text-blue-100 max-w-[180px] sm:max-w-[200px] text-sm leading-relaxed"
                  >
                    Redeem NestCoins for prizes to help you towards Homeownership.
                  </RobotoFont>
                </div>

                {/* Rewards Shop Button - positioned at bottom */}
                <div className="absolute bottom-3 right-4 sm:right-6 z-20">
                  <button
                    className="bg-white text-blue-600 hover:bg-blue-50 transition-colors px-6 sm:px-8 py-2 rounded-full"
                    onClick={handleRewardsShop}
                  >
                    <RobotoFont weight={500} className="text-sm">
                      Rewards Shop
                    </RobotoFont>
                  </button>
                </div>

                {/* Background images - responsive sizing and positioning */}
                <img
                  src="src/assets/images/static/nest_coins.png"
                  alt="Nest Coins"
                  className="absolute top-4 sm:top-7 right-[80px] sm:right-[118px] w-[70px] h-[70px] sm:w-[100px] sm:h-[100px] opacity-90"
                />
                <img
                  src="src/assets/images/static/coin_bag.png"
                  alt="Coin Bag"
                  className="absolute top-1 sm:top-1.5 right-[5px] w-[70px] h-[70px] sm:w-[100px] sm:h-[100px] opacity-90"
                />
              </div>

              {/* Weekly Leaderboard Card */}
              <LeaderboardCard
                entries={leaderboard}
                onMenuClick={handleLeaderboardMenu}
              />

              {/* Help & Support Cards */}
              <div className="flex flex-col gap-4">
                {supportCards.map((card) => (
                  <SupportCard
                    key={card.id}
                    supportCard={card}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Modal - Only renders on Overview page */}
      <OnBoardingPage 
        isOpen={showOnboarding} 
        onClose={handleCloseOnboarding} 
      />
    </>
  );
};

export default OverviewPage;