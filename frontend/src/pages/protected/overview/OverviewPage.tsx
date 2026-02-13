import React, { useEffect, useState } from "react";
import { createPortal } from 'react-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../../store/store';
import { openOnboardingModal, closeOnboardingModal } from '../../../store/slices/uiSlice';
import OnBoardingPage from '../../../components/protected/onboarding/OnBoardingPage';
import { useOnboardingStatus } from '../../../hooks/queries/useOnboardingStatus';
import { OnestFont } from "../../../assets";
import {
  HeroModuleCard,
  ModuleOverviewCard,
  UserProfileCard,
  StreakCard,
  DailyGoalsCard,
  LeaderboardCard,
} from "./components";
import { LeaderboardEntry } from "./types/overview.types";
import { Icons, Images } from './images';
import { useCoinBalance } from "../../../hooks/queries/useCoinBalance";
import { useDashboardOverview } from "../../../hooks/queries/useDashboardOverview";
import { useDashboardModules } from "../../../hooks/queries/useDashboardModules";
import { useQuizLeaderboard } from "../../../hooks/queries/useQuizLeaderboard";
import { useMyProgress } from "../../../hooks/queries/useMyProgress";
import type { QuizLeaderboardEntry } from "../../../hooks/queries/useQuizLeaderboard";
import { BetaTooltip } from "../../../components";

// ─── Transform helpers ───────────────────────────────────────────
const transformLeaderboardData = (
  entries: QuizLeaderboardEntry[]
): LeaderboardEntry[] => {
  return entries.map((entry) => ({
    id: entry.user_id,
    name: entry.is_current_user ? 'You' : entry.name,
    avatar: Icons.GenericAvatar,
    coins: Math.round(entry.average_score),
    rank: entry.rank,
  }));
};

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: '1', name: 'Alex Johnson', avatar: Icons.GenericAvatar, coins: 1250, rank: 1 },
  { id: '2', name: 'Sarah Chen', avatar: Icons.GenericAvatar, coins: 1100, rank: 2 },
  { id: '3', name: 'Mike Rodriguez', avatar: Icons.GenericAvatar, coins: 980, rank: 3 },
  { id: '4', name: 'Emma Davis', avatar: Icons.GenericAvatar, coins: 850, rank: 4 },
  { id: '5', name: 'You', avatar: Icons.GenericAvatar, coins: 750, rank: 5 },
  { id: '6', name: 'Jordan Lee', avatar: Icons.GenericAvatar, coins: 700, rank: 6 },
  { id: '7', name: 'Taylor Swift', avatar: Icons.GenericAvatar, coins: 650, rank: 7 },
  { id: '8', name: 'Chris P.', avatar: Icons.GenericAvatar, coins: 600, rank: 8 },
];

// ─── Component ─────────────────────────────────────────────────────
const OverviewPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const showOnboarding = useSelector((state: RootState) => state.ui.showOnboardingModal);
  const user = useSelector((state: RootState) => state.auth.user);
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  // ─── Hooks ───
  useCoinBalance();
  const { data: onboardingStatus, isLoading: isOnboardingLoading } = useOnboardingStatus();
  const { data: overviewData, isLoading: isOverviewLoading, error: overviewError } = useDashboardOverview();
  const { data: modulesData, isLoading: isModulesLoading, error: modulesError } = useDashboardModules();
  const { data: leaderboardData } = useQuizLeaderboard(8);
  const { data: progressData } = useMyProgress();

  const isLoading = isOverviewLoading || isModulesLoading;
  const error = overviewError || modulesError;

  // ─── Data derivations ───
  // Hero card: find the current in-progress module
  const currentModule = modulesData?.find(
    (m: any) => m.status === 'in_progress' || m.status === 'not_started'
  );

  // All modules for the list
  const allModules = modulesData || [];

  // Leaderboard
  const leaderboard =
    leaderboardData?.leaderboard && leaderboardData.leaderboard.length > 0
      ? transformLeaderboardData(leaderboardData.leaderboard)
      : MOCK_LEADERBOARD;

  // User stats — prefer progressData when available for accuracy
  const totalCoins = progressData?.coins_balance ?? overviewData?.total_coins ?? 0;
  const totalBadges = progressData?.badges_earned ?? overviewData?.total_badges ?? 0;
  const modulesCompleted = progressData?.modules_completed ?? overviewData?.modules_completed ?? 0;
  const totalModules = overviewData?.total_modules ?? 0;
  const [currentStreak, setCurrentStreak] = useState(overviewData?.current_streak ?? 0);
  const overallProgress =
    progressData?.progress_percentage ??
    (totalModules > 0 ? Math.round((modulesCompleted / totalModules) * 100) : 0);

  // ─── Event handlers ───
  const handleContinueHero = () => {
    if (currentModule) {
      navigate(`/app/modules/${currentModule.module.id}`);
    }
  };

  const handleModuleAction = (moduleId: string) => {
    navigate(`/app/modules/${moduleId}`);
  };

  const handleLeaderboardMenu = () => {
    console.log("Leaderboard menu clicked");
  };

  const handleCloseOnboarding = () => {
    console.log('OverviewPage: Closing onboarding modal');
    dispatch(closeOnboardingModal());
  };

  // ─── Module status helper ───
  const getModuleStatus = (moduleProgress: any): "completed" | "in-progress" | "not-started" | "locked" => {
    if (moduleProgress.status === 'completed') return 'completed';
    if (moduleProgress.status === 'in_progress') return 'in-progress';
    if (moduleProgress.status === 'locked') return 'locked';
    return 'not-started';
  };

  // ─── Effects ───
  useEffect(() => {
    const bgElement = document.getElementById('section-background');
    if (bgElement) {
      bgElement.className = 'bg-gradient-to-b from-[#EFF6FF] to-light-background-blue';
      bgElement.style.backgroundSize = 'cover';
    }
  }, []);

  // Onboarding modal logic — UNCHANGED
  useEffect(() => {
    console.log('OverviewPage: useEffect triggered');
    console.log('OverviewPage: showOnboarding:', showOnboarding);
    console.log('OverviewPage: onboardingStatus:', onboardingStatus);
    console.log('OverviewPage: isOnboardingLoading:', isOnboardingLoading);

    if (isOnboardingLoading) {
      console.log('OverviewPage: Still loading onboarding status, skipping check');
      return;
    }

    if (onboardingStatus && !onboardingStatus.completed && !showOnboarding) {
      console.log('OverviewPage: Onboarding not completed, opening modal');
      dispatch(openOnboardingModal());
    }
  }, [dispatch, showOnboarding, onboardingStatus, isOnboardingLoading]);

  useEffect(() => {
    if (!isLoading) {
      setIsPageLoaded(true);
    }
  }, [isLoading]);

  console.log('OverviewPage: Rendering, showOnboarding:', showOnboarding);

  // Check if error is ONBOARDING_REQUIRED (expected state, not a real error)
  const isOnboardingRequiredError = error instanceof Error && error.message === 'ONBOARDING_REQUIRED';

  // ─── Render onboarding modal ───
  const onboardingModal = showOnboarding
    ? createPortal(
        <>
          {console.log('OverviewPage: Rendering OnBoardingPage with isOpen:', showOnboarding)}
          <OnBoardingPage isOpen={showOnboarding} onClose={handleCloseOnboarding} />
        </>,
        document.body
      )
    : null;

  // ─── Loading state ───
  if (isLoading) {
    return (
      <>
        {onboardingModal}
        <div className="h-full flex items-center justify-center">
          <div className="text-center">
            <OnestFont weight={500} lineHeight="relaxed" className="text-text-grey text-lg mb-2">
              Loading your dashboard...
            </OnestFont>
            <div className="w-8 h-8 border-4 border-logo-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </>
    );
  }

  // ─── Error state ───
  if (error && !isOnboardingRequiredError) {
    return (
      <>
        {onboardingModal}
        <div className="h-full flex items-center justify-center">
          <div className="text-center max-w-md p-6">
            <OnestFont weight={500} lineHeight="relaxed" className="text-status-red text-lg mb-2">
              Oops! Something went wrong
            </OnestFont>
            <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey mb-4">
              {error instanceof Error ? error.message : 'Failed to load dashboard data'}
            </OnestFont>
            <button
              onClick={() => window.location.reload()}
              className="bg-logo-blue text-white px-6 py-2 rounded-full hover:opacity-90 transition-colors"
            >
              <OnestFont weight={500} lineHeight="relaxed" className="text-sm">
                Retry
              </OnestFont>
            </button>
          </div>
        </div>
      </>
    );
  }

  // ─── Main Render ───
  return (
    <>
      {onboardingModal}
      <div className="h-full overflow-y-auto overflow-x-hidden">
        <div
          className={`p-4 lg:p-6 w-full transition-all duration-700 ease-out ${
            isPageLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          {/* ════════════════ 2-Column Layout ════════════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 lg:gap-6 w-full">
            {/* ──── LEFT: Main Content Column ──── */}
            <div className="flex flex-col gap-5 lg:gap-6 min-w-0 w-full">
              {/* 1. Hero Module Card */}
              {currentModule && (
                <HeroModuleCard
                  moduleTitle={currentModule.module.title}
                  moduleDescription={currentModule.module.description}
                  tags={[
                    currentModule.module.difficulty_level || 'Beginner',
                    'Video',
                  ].filter(Boolean)}
                  coinReward={100}
                  progressPercentage={Math.round(currentModule.completion_percentage || 0)}
                  estimatedMinutesRemaining={
                    Math.max(
                      (currentModule.module.estimated_duration_minutes || 20) -
                        Math.round(
                          ((currentModule.completion_percentage || 0) / 100) *
                            (currentModule.module.estimated_duration_minutes || 20)
                        ),
                      1
                    )
                  }
                  thumbnailUrl={currentModule.module.thumbnail_url || Images.OverviewImg1}
                  onContinue={handleContinueHero}
                />
              )}

              {/* Fallback: If no in-progress module and overviewData has next_lesson */}
              {!currentModule && overviewData?.next_lesson && (
                <HeroModuleCard
                  moduleTitle={overviewData.next_lesson.title}
                  moduleDescription={
                    overviewData.next_lesson.description || "Continue your learning journey"
                  }
                  tags={['Video', 'Beginner']}
                  coinReward={overviewData.next_lesson.nest_coins_reward || 25}
                  progressPercentage={0}
                  estimatedMinutesRemaining={
                    overviewData.next_lesson.estimated_duration_minutes || 20
                  }
                  thumbnailUrl={overviewData.next_lesson.image_url || Images.OverviewImg1}
                  onContinue={() => {
                    if (overviewData.next_lesson?.id) {
                      navigate(`/app/lessons/${overviewData.next_lesson.id}`);
                    }
                  }}
                />
              )}

              {/* 2. Goals Card */}
              <DailyGoalsCard
                goals={[
                  {
                    id: 'complete-first-module',
                    title: 'Complete First Module',
                    current: modulesCompleted,
                    target: 1,
                  },
                  {
                    id: 'grow-first-tree',
                    title: 'Grow Your First Tree',
                    current: totalBadges,
                    target: 1,
                  },
                  {
                    id: 'complete-all-modules',
                    title: 'Complete All Modules',
                    current: modulesCompleted,
                    target: totalModules || 1,
                  },
                  {
                    id: 'earn-500-coins',
                    title: 'Earn 500 Coins',
                    current: totalCoins,
                    target: 500,
                  },
                ]}
              />

              {/* 3. Modules Overview */}
              {allModules.length > 0 && (
                <div>
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-4">
                    <OnestFont
                      as="h2"
                      weight={700}
                      lineHeight="tight"
                      className="text-text-blue-black text-lg"
                    >
                      Modules Overview
                    </OnestFont>

                    {/* See all - wrapped with BetaTooltip */}
                    <BetaTooltip position="left">
                      <button
                        className="text-logo-blue hover:opacity-80 transition-opacity cursor-default"
                      >
                        <OnestFont weight={500} lineHeight="relaxed" className="text-sm">
                          See all
                        </OnestFont>
                      </button>
                    </BetaTooltip>
                  </div>

                  {/* Module Cards List */}
                  <div className="flex flex-col gap-4">
                    {allModules
                      .filter((m: any) => !m.module.id.startsWith('mock-module'))
                      .map((moduleProgress: any) => (
                        <ModuleOverviewCard
                          key={moduleProgress.module.id}
                          orderNumber={moduleProgress.module.order_index}
                          title={moduleProgress.module.title}
                          coinReward={100}
                          durationMinutes={
                            moduleProgress.module.estimated_duration_minutes || 0
                          }
                          description={moduleProgress.module.description}
                          progressPercentage={Math.round(
                            moduleProgress.completion_percentage || 0
                          )}
                          tags={[
                            moduleProgress.module.difficulty_level,
                            `${moduleProgress.total_lessons} lessons`,
                          ].filter(Boolean)}
                          thumbnailUrl={
                            moduleProgress.module.thumbnail_url || Images.OverviewImg2
                          }
                          status={getModuleStatus(moduleProgress)}
                          onAction={() =>
                            handleModuleAction(moduleProgress.module.id)
                          }
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* ──── RIGHT: Sidebar Column ──── */}
            <div className="flex flex-col gap-5 lg:gap-6 w-full min-w-0">
              {/* 4. User Profile Card */}
              <UserProfileCard
                firstName={user?.firstName || 'User'}
                avatarUrl={user?.photoURL || null}
                totalCoins={totalCoins}
                currentStreak={currentStreak}
                modulesCompleted={modulesCompleted}
                totalModules={totalModules}
                progressPercentage={overallProgress}
                onNotificationClick={() => navigate('/app/notifications')}
                onSettingsClick={() => navigate('/app/settings')}
              />

              {/* 5. Streak Card */}
              <StreakCard onStreakChange={setCurrentStreak} />

              {/* 7. Top Learners / Leaderboard */}
              <LeaderboardCard
                entries={leaderboard}
                onMenuClick={handleLeaderboardMenu}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OverviewPage;