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
import { Icons, Images } from './images';  // ✅ Import images
import { getDashboardOverview, getDashboardModules, getCoinBalance, getDashboardBadges } from "../../../services/dashboardAPI";

// Helper functions to transform API data to UI types
const transformAchievementsToTasks = (achievements: string[]): Task[] => {
  const taskDefinitions = [
    {
      id: "1",
      title: "Setup your Profile",
      icon: Icons.BlueAvatar,
      points: 100,
      achievementKey: "profile_setup",
    },
    {
      id: "2",
      title: "Complete your Financial Profile",
      icon: Icons.BlueAvatar,
      points: 100,
      achievementKey: "financial_profile",
      isWIP: true,
    },
  ];

  return taskDefinitions.map(taskDef => ({
    id: taskDef.id,
    title: taskDef.title,
    icon: taskDef.icon,
    points: taskDef.points,
    completed: achievements.includes(taskDef.achievementKey),
    isWIP: taskDef.isWIP,
  }));
};

const transformNextLessonToLesson = (apiLesson: any, moduleNumber: number = 1): Lesson | null => {
  if (!apiLesson) return null;

  return {
    id: apiLesson.id,
    moduleNumber: moduleNumber,
    title: apiLesson.title,
    duration: `${apiLesson.estimated_duration_minutes} minutes`,
    description: apiLesson.description,
    points: apiLesson.nest_coins_reward,
    moduleTitle: '',
    imageUrl: apiLesson.image_url,
    status: apiLesson.is_completed ? 'start' : 'continue',
  };
};

const transformModuleToLesson = (moduleProgress: any): Lesson => {
  const isLocked = moduleProgress.status === 'locked';
  const isStarted = moduleProgress.lessons_completed > 0;

  return {
    id: moduleProgress.module.id,
    moduleNumber: moduleProgress.module.order_index,
    title: moduleProgress.module.title,
    lessonsCount: moduleProgress.total_lessons,
    description: moduleProgress.module.description,
    points: 100,
    moduleTitle: '',
    tags: [
      moduleProgress.module.difficulty_level,
      `${moduleProgress.total_lessons} lessons`
    ].filter(Boolean),
    imageUrl: moduleProgress.module.thumbnail_url,
    status: isLocked ? 'locked' : isStarted ? 'continue' : 'start',
  };
};

const generateMockLeaderboard = (): LeaderboardEntry[] => {
  return [
    { id: '1', name: 'Alex Johnson', avatar: Icons.GenericAvatar, coins: 1250, rank: 1 },
    { id: '2', name: 'Sarah Chen', avatar: Icons.GenericAvatar, coins: 1100, rank: 2 },
    { id: '3', name: 'Mike Rodriguez', avatar: Icons.GenericAvatar, coins: 980, rank: 3 },
    { id: '4', name: 'Emma Davis', avatar: Icons.GenericAvatar, coins: 850, rank: 4 },
    { id: '5', name: 'You', avatar: Icons.GenericAvatar, coins: 750, rank: 5 },
  ];
};

// ✅ Mock data with imported images
const MOCK_TASKS: Task[] = [
  {
    id: "1",
    title: "Setup your Profile",
    icon: Icons.BlueAvatar,
    points: 100,
    completed: true,
  },
  {
    id: "2",
    title: "Complete your Financial Profile (WIP!)",
    icon: Icons.BlueAvatar,
    points: 100,
    completed: false,
    isWIP: true,
  },
];

const MOCK_CONTINUE_LESSON: Lesson = {
  id: "lesson-1",
  moduleNumber: 1,
  title: "Mindset & Financial Readiness",
  duration: "20 minutes",
  description:
    "Get your head in the game—and your wallet in shape—before you shop for your dream home.",
  points: 25,
  moduleTitle: "Readiness & Decision-Making Module",
  imageUrl: Images.OverviewImg1,
  status: "continue",
};

const MOCK_LEARNING_MODULES: Lesson[] = [
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
    imageUrl: Images.OverviewImg2,
    status: "start",
  },
];

const OverviewPage: React.FC = () => {
  const dispatch = useDispatch();
  const showOnboarding = useSelector((state: RootState) => state.ui.showOnboardingModal);
  const [isWelcomeExpanded, setIsWelcomeExpanded] = useState(true);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data from API
  const [tasks, setTasks] = useState<Task[]>([]);
  const [continueLesson, setContinueLesson] = useState<Lesson | null>(null);
  const [learningModules, setLearningModules] = useState<Lesson[]>([]);
  // TODO: Display these in the UI when designs are ready
  // const [totalCoins, setTotalCoins] = useState(0);
  // const [currentStreak, setCurrentStreak] = useState(0);

  // Leaderboard data from API
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([
    {
      id: "1",
      name: "Brandon B.",
      avatar: Icons.GenericAvatar,
      coins: 302,
      rank: 1,
    },
    {
      id: "2",
      name: "Brandon B.",
      avatar: Icons.GenericAvatar,
      coins: 302,
      rank: 2,
    },
    {
      id: "3",
      name: "Brandon B.",
      avatar: Icons.GenericAvatar,
      coins: 302,
      rank: 3,
    },
    {
      id: "4",
      name: "Brandon B.",
      avatar: Icons.GenericAvatar,
      coins: 302,
      rank: 4,
    },
    {
      id: "5",
      name: "Brandon B.",
      avatar: Icons.GenericAvatar,
      coins: 302,
      rank: 5,
    },
  ]);

  const [supportCards] = useState<SupportCardType[]>([
    {
      id: "help",
      title: "Help Center",
      subtitle: "Find out what you need.",
      icon: Icons.GetHelp,
      action: () => console.log("Help Center clicked"),
    },
    {
      id: "chat",
      title: "Chat with an Expert",
      subtitle: "Speak with an expert.",
      icon: Icons.Chat,
      action: () => console.log("Chat clicked"),
    },
    {
      id: "share",
      title: "Share NestNavigate with Your Friends",
      subtitle: "Share the rewards of homeownership.",
      icon: Icons.Share,
      action: () => console.log("Share clicked"),
    },
  ]);

  // Event handlers
  const handleLessonAction = (lessonId: string) => {
    console.log("Lesson action:", lessonId);
  };

  const handleSeeAllModules = () => {
    console.log("See all modules clicked");
  };

  const handleRewardsShop = () => {
    console.log("Rewards shop clicked");
  };

  const handleLeaderboardMenu = () => {
    console.log("Leaderboard menu clicked");
  };

  const handleCloseOnboarding = () => {
    dispatch(closeOnboardingModal());
  };

  // ✅ Onboarding check useEffect
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
        dispatch(openOnboardingModal());
      }
    };

    if (!showOnboarding) {
      checkOnboardingAndShowModal();
    }
  }, [dispatch, showOnboarding]);

  // ✅ Dashboard data fetch useEffect
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch each API individually with error handling  
        let overviewData: any = null;
        let modulesData: any[] = [];
        // let coinsData: any = null; // TODO: Use when coin display is implemented

        // Try to fetch overview data
        try {
          overviewData = await getDashboardOverview();
          console.log('✅ Overview data received');
        } catch (error) {
          console.warn('⚠️ Overview API failed:', error);
        }

        // Try to fetch modules data
        try {
          modulesData = await getDashboardModules();
          console.log('✅ Modules data received');
        } catch (error) {
          console.warn('⚠️ Modules API failed:', error);
        }

        // Try to fetch coins data
        try {
          await getCoinBalance();
          console.log('✅ Coins data received');
        } catch (error) {
          console.warn('⚠️ Coins API failed:', error);
        }

        // Try to fetch badges data (optional)
        try {
          await getDashboardBadges();
          console.log('✅ Badges data received');
        } catch (error) {
          console.warn('⚠️ Badges API failed:', error);
        }

        // Transform and set data with fallbacks
        if (overviewData) {
          const transformedTasks = transformAchievementsToTasks(overviewData.recent_achievements || []);
          setTasks(transformedTasks.length > 0 ? transformedTasks : MOCK_TASKS);

          const transformedLesson = transformNextLessonToLesson(overviewData.next_lesson);
          setContinueLesson(transformedLesson || MOCK_CONTINUE_LESSON);
        } else {
          setTasks(MOCK_TASKS);
          setContinueLesson(MOCK_CONTINUE_LESSON);
        }

        if (modulesData && modulesData.length > 0) {
          const transformedModules = modulesData.map(transformModuleToLesson).slice(0, 3);
          setLearningModules(transformedModules);
        } else {
          setLearningModules(MOCK_LEARNING_MODULES);
        }

        // Set leaderboard (currently mock)
        setLeaderboard(generateMockLeaderboard());

        setIsPageLoaded(true);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
        
        // ✅ Use mock data on error
        console.log('📝 Error loading from API, using mock data');
        setTasks(MOCK_TASKS);
        setContinueLesson(MOCK_CONTINUE_LESSON);
        setLearningModules(MOCK_LEARNING_MODULES);
        setLeaderboard(generateMockLeaderboard());
        setIsPageLoaded(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <RobotoFont weight={500} className="text-gray-600 text-lg mb-2">
            Loading your dashboard...
          </RobotoFont>
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md p-6">
          <RobotoFont weight={500} className="text-red-600 text-lg mb-2">
            Oops! Something went wrong
          </RobotoFont>
          <RobotoFont weight={400} className="text-gray-600 mb-4">
            {error}
          </RobotoFont>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition-colors"
          >
            <RobotoFont weight={500} className="text-sm">
              Retry
            </RobotoFont>
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Onboarding Modal */}
      {showOnboarding && (
        <OnBoardingPage onClose={handleCloseOnboarding} />
      )}

      {/* Main Dashboard */}
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
              <WelcomeCard
                tasks={tasks}
                isExpanded={isWelcomeExpanded}
                onToggleExpand={() => setIsWelcomeExpanded(!isWelcomeExpanded)}
              />

              {/* Continue Lesson Section */}
              {continueLesson && (
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
              )}

              {/* Learning Modules Section */}
              {learningModules.length > 0 && (
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

                  <div className="flex flex-col gap-4">
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
              )}
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-4 lg:gap-6 w-full 2xl:w-[500px] min-w-0">
              {/* Learn Earn Rewards Card - ✅ UPDATED with imported images */}
              <div
                className="relative overflow-hidden bg-[#D7DEFF] rounded-xl flex flex-col justify-between p-4 sm:p-6"
                style={{ height: "12.5rem" }}
              >
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

                {/* ✅ Updated background images */}
                <img
                  src={Images.NestCoins}
                  alt="Nest Coins"
                  className="absolute top-4 sm:top-7 right-[80px] sm:right-[118px] w-[70px] h-[70px] sm:w-[100px] sm:h-[100px] opacity-90"
                />
                <img
                  src={Images.CoinBag}
                  alt="Coin Bag"
                  className="absolute top-1 sm:top-1.5 right-[5px] w-[70px] h-[70px] sm:w-[100px] sm:h-[100px] opacity-90"
                />
              </div>

              <LeaderboardCard
                entries={leaderboard}
                onMenuClick={handleLeaderboardMenu}
              />

              <div className="flex flex-col gap-4">
                {supportCards.map((card) => (
                  <SupportCard key={card.id} supportCard={card} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OverviewPage;