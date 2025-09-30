import React, { useEffect, useState } from "react";
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
  const [isWelcomeExpanded, setIsWelcomeExpanded] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

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
    {
      id: "5",
      name: "Brandon B.",
      avatar: "src/assets/images/icons/generic-avatar-icon.svg",
      coins: 302,
      rank: 5,
    },
  ]);

  const [supportCards] = useState<SupportCardType[]>([
    {
      id: "help",
      title: "Help Center",
      subtitle: "Find out what you need.",
      icon: "src/assets/images/icons/get-help-icon.svg",
      action: () => console.log("Help Center clicked"), // TODO: Navigate to help center
    },
    {
      id: "chat",
      title: "Chat with an Expert",
      subtitle: "Speak with an expert.",
      icon: "src/assets/images/icons/chat-icon.svg",
      action: () => console.log("Chat clicked"), // TODO: Open chat interface
    },
    {
      id: "share",
      title: "Share NestNavigate with Your Friends",
      subtitle: "Share the rewards of homeownership.",
      icon: "src/assets/images/icons/share-icon.svg",
      action: () => console.log("Share clicked"), // TODO: Open share dialog
    },
  ]);

  // Event handlers
  const handleLessonAction = (lessonId: string) => {
    console.log("Lesson action:", lessonId);
    // TODO: Navigate to lesson or handle lesson action
  };

  const handleSeeAllModules = () => {
    console.log("See all modules clicked");
    // TODO: Navigate to modules page
  };

  const handleRewardsShop = () => {
    console.log("Rewards shop clicked");
    // TODO: Navigate to rewards shop
  };

  const handleLeaderboardMenu = () => {
    console.log("Leaderboard menu clicked");
    // TODO: Show leaderboard options
  };

  // Trigger smooth page load animation
  useEffect(() => {
    setIsPageLoaded(true);
    // TODO: Add API calls here to fetch:
    // - User tasks/checklist items
    // - Current lesson progress
    // - Available learning modules
    // - Leaderboard data
    // - Support options
  }, []);

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <div
        className={`p-4 lg:p-6 w-full transition-all duration-700 ease-out ${
          isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
      <RobotoFont as="h1" weight={500} className="mb-4 lg:mb-2 mt-2 text-base sm:text-lg">
        Onboarding Checklist
      </RobotoFont>

      <div className="grid grid-cols-1 2xl:grid-cols-[1fr_500px] gap-4 lg:gap-6 w-full">
        {/* Left Column */}
        <div className="flex flex-col gap-4 lg:gap-6 min-w-0 w-full 2xl:max-w-[980px]">
          {/* Welcome Card */}
          <WelcomeCard
            tasks={tasks}
            isExpanded={isWelcomeExpanded}
            onToggleExpand={() => setIsWelcomeExpanded(!isWelcomeExpanded)}
          />

          {/* Continue Lesson Section */}
          <div>
            <RobotoFont
              as="h2"
              weight={500}
              className="text-gray-900 mb-4 text-base sm:text-lg font-medium"
            >
              Continue Lesson
            </RobotoFont>

            <LessonCard
              lesson={continueLesson}
              onAction={handleLessonAction}
              showTags={false}
            />
          </div>

          {/* Learning Modules Section */}
          <div>
            <div className="flex items-center justify-between mb-4 gap-2">
              <RobotoFont
                as="h2"
                weight={500}
                className="text-gray-900 text-base sm:text-lg flex-1 min-w-0"
                style={{ 
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word'
                }}
              >
                Learning Modules
              </RobotoFont>
              <button
                className="text-black hover:text-blue-700 flex-shrink-0"
                onClick={handleSeeAllModules}
              >
                <RobotoFont weight={500} className="text-sm whitespace-nowrap">
                  See all
                </RobotoFont>
              </button>
            </div>

            {learningModules.map((module) => (
              <LessonCard
                key={module.id}
                lesson={module}
                onAction={handleLessonAction}
                showTags={true}
              />
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4 lg:gap-6 w-full 2xl:w-[500px] min-w-0">
          {/* Learn Earn Rewards Card */}
          <div
            className="relative overflow-hidden bg-[#D7DEFF] rounded-xl flex flex-col justify-between p-4 sm:p-6"
            style={{ height: "12.5rem" }}
          >
            {/* Content */}
            <div className="relative z-10 max-w-[60%] sm:max-w-[55%]">
              <RobotoFont
                as="h2"
                weight={500}
                className="text-gray-900 text-2xl sm:text-3xl font-medium leading-tight"
              >
                Learn. Earn.
              </RobotoFont>
              <RobotoFont
                as="h2"
                weight={500}
                className="text-gray-900 mb-3 text-2xl sm:text-3xl font-medium leading-tight"
              >
                Get Rewards.
              </RobotoFont>
              <RobotoFont
                as="p"
                weight={400}
                className="text-gray-700 max-w-[180px] sm:max-w-[200px] text-sm leading-relaxed"
              >
                Redeem NestCoins for prizes to help you towards Homeownership.
              </RobotoFont>
            </div>

            {/* Rewards Shop Button - positioned at bottom */}
            <div className="absolute bottom-3 right-4 sm:right-6 z-20">
              <button
                className="bg-[#3F6CB9] text-white hover:opacity-90 transition-opacity px-6 sm:px-8 py-2 rounded-full"
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
              <SupportCard key={card.id} supportCard={card} />
            ))}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default OverviewPage;
