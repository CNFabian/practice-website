/**
 * TanStack Query Key Factory
 *
 * Centralized query key management for consistent caching and invalidation.
 *
 * Key Structure Philosophy:
 * - Hierarchical: ['domain', 'resource', ...identifiers]
 * - Enables precise invalidation: invalidate all 'learning' or just ['learning', 'lessons', '123']
 * - Type-safe with 'as const' assertion
 *
 * Usage Examples:
 *   queryKeys.auth.currentUser()           → ['auth', 'currentUser']
 *   queryKeys.learning.module('123')       → ['learning', 'modules', '123']
 *   queryKeys.dashboard.coins()            → ['dashboard', 'coins']
 *
 * Invalidation Examples:
 *   // Invalidate specific lesson
 *   queryClient.invalidateQueries({ queryKey: queryKeys.learning.lesson('123') })
 *
 *   // Invalidate all lessons
 *   queryClient.invalidateQueries({ queryKey: queryKeys.learning.lessons() })
 *
 *   // Invalidate entire learning domain
 *   queryClient.invalidateQueries({ queryKey: queryKeys.learning.all })
 */

export const queryKeys = {
  // ════════════════════════════════════════════════════════════════
  // AUTH - Authentication & User Identity
  // ════════════════════════════════════════════════════════════════
  auth: {
    /**
     * Base key for all auth queries
     * Use for invalidating all auth data on logout
     */
    all: ['auth'] as const,

    /**
     * Current authenticated user
     * Called on: App init, ProtectedRoute, SettingsPage
     * staleTime: 2-5 minutes (changes on profile update)
     */
    currentUser: () => [...queryKeys.auth.all, 'currentUser'] as const,

    /**
     * User profile for specific user (if needed for admin features)
     */
    profile: (userId: string) => [...queryKeys.auth.all, 'profile', userId] as const,
  },

  // ════════════════════════════════════════════════════════════════
  // LEARNING - Modules, Lessons, Progress
  // ════════════════════════════════════════════════════════════════
  learning: {
    /**
     * Base key for all learning queries
     */
    all: ['learning'] as const,
    milestone: (lessonId: string) => ['learning', 'milestone', lessonId] as const,
    batchProgress: () => ['learning', 'progress', 'batch'] as const,

    /**
     * All modules list
     * Called on: ModulesPage, ModulesView, OverviewPage
     * staleTime: 5 minutes (semi-static)
     */
    modules: () => [...queryKeys.learning.all, 'modules'] as const,

    /**
     * Single module details
     * Called on: ModuleView, ModuleQuizView
     * staleTime: 5 minutes
     */
    module: (moduleId: string | number) =>
      [...queryKeys.learning.all, 'modules', String(moduleId)] as const,

    /**
     * Lessons within a specific module
     * Called on: ModuleView
     * staleTime: 5 minutes
     */
    moduleLessons: (moduleId: string | number) =>
      [...queryKeys.learning.all, 'modules', String(moduleId), 'lessons'] as const,

    /**
     * Base key for all lessons
     */
    lessons: () => [...queryKeys.learning.all, 'lessons'] as const,

    /**
     * Single lesson details
     * Called on: LessonView
     * staleTime: 5 minutes
     * Invalidated by: completeLesson, submitQuiz
     */
    lesson: (lessonId: string | number) =>
      [...queryKeys.learning.all, 'lessons', String(lessonId)] as const,

    /**
     * Quiz data for a specific lesson
     * Called on: LessonView, ModuleQuizView
     * staleTime: 5 minutes (quiz questions are static)
     */
    lessonQuiz: (lessonId: string | number) =>
      [...queryKeys.learning.all, 'lessons', String(lessonId), 'quiz'] as const,

    /**
     * User's learning progress
     */
    progress: {
      /**
       * Base key for all progress queries
       */
      all: () => [...queryKeys.learning.all, 'progress'] as const,

      /**
       * Overall progress summary
       * Called on: OverviewPage
       * staleTime: 2 minutes
       * Invalidated by: completeLesson, submitQuiz
       */
      summary: () => [...queryKeys.learning.all, 'progress', 'summary'] as const,
    },
  },

  // ════════════════════════════════════════════════════════════════
  // DASHBOARD - Overview, Stats, Aggregations
  // ════════════════════════════════════════════════════════════════
  dashboard: {
    /**
     * Base key for all dashboard queries
     */
    all: ['dashboard'] as const,

    /**
     * Dashboard overview data
     * Called on: OverviewPage
     * staleTime: 2 minutes
     * Invalidated by: completeLesson, submitQuiz, completeOnboarding
     */
    overview: () => [...queryKeys.dashboard.all, 'overview'] as const,

    /**
     * Module progress for dashboard
     * Called on: OverviewPage
     * staleTime: 5 minutes
     * Invalidated by: completeLesson, submitQuiz
     */
    modules: () => [...queryKeys.dashboard.all, 'modules'] as const,

    /**
     * User's coin balance (CRITICAL - called 3+ times)
     * Called on: OverviewPage, RewardsPage, Header
     * staleTime: 30 seconds (real-time data)
     * Invalidated by: submitQuiz, completeLesson, redeemCoupon
     */
    coins: () => [...queryKeys.dashboard.all, 'coins'] as const,

    /**
     * Badges for dashboard
     * Called on: OverviewPage, BadgesPage
     * staleTime: 2 minutes
     * Invalidated by: submitQuiz (badge unlock)
     */
    badges: () => [...queryKeys.dashboard.all, 'badges'] as const,

    /**
     * User's coin transaction history
     * Called on: RewardsPage, TransactionHistory
     * staleTime: 2 minutes
     * Invalidated by: completeLesson, submitQuiz, redeemCoupon
     */
    transactions: (params?: { limit?: number; offset?: number }) =>
      params
        ? [...queryKeys.dashboard.all, 'transactions', params] as const
        : [...queryKeys.dashboard.all, 'transactions'] as const,

    /**
     * Comprehensive user statistics
     * Called on: OverviewPage, StatisticsSection
     * staleTime: 5 minutes
     * Invalidated by: completeLesson, submitQuiz
     */
    statistics: () => [...queryKeys.dashboard.all, 'statistics'] as const,

    /**
     * Recent user activity feed
     * Called on: OverviewPage, ActivityFeed
     * staleTime: 1 minute
     * Invalidated by: completeLesson, submitQuiz, redeemCoupon
     */
    activity: (limit?: number) =>
      limit
        ? [...queryKeys.dashboard.all, 'activity', limit] as const
        : [...queryKeys.dashboard.all, 'activity'] as const,
  },

  // ════════════════════════════════════════════════════════════════
  // QUIZ - Attempts, Statistics, Leaderboard
  // ════════════════════════════════════════════════════════════════
  quiz: {
    /**
     * Base key for all quiz queries
     */
    all: ['quiz'] as const,

    /**
     * Quiz attempts for a specific lesson
     * Called on: QuizResults
     * staleTime: 2 minutes
     * Invalidated by: submitQuiz
     */
    attempts: (lessonId: string | number) =>
      [...queryKeys.quiz.all, 'attempts', String(lessonId)] as const,

    /**
     * Detailed results for a specific attempt
     * Called on: QuizResults
     * staleTime: 10 minutes (immutable once created)
     */
    attemptDetails: (attemptId: string) =>
      [...queryKeys.quiz.all, 'attempt', attemptId] as const,

    /**
     * User's quiz statistics
     * Called on: Dashboard
     * staleTime: 5 minutes
     * Invalidated by: submitQuiz
     */
    statistics: () => [...queryKeys.quiz.all, 'statistics'] as const,

    /**
     * Quiz leaderboard
     * Called on: Dashboard
     * staleTime: 30 seconds (real-time)
     */
    leaderboard: (limit?: number) =>
      limit
        ? [...queryKeys.quiz.all, 'leaderboard', limit] as const
        : [...queryKeys.quiz.all, 'leaderboard'] as const,
  },

  // ════════════════════════════════════════════════════════════════
  // BADGES - Achievements & Progress
  // ════════════════════════════════════════════════════════════════
  badges: {
    /**
     * Base key for all badge queries
     */
    all: ['badges'] as const,

    /**
     * User's badges list
     * Called on: BadgesPage, OverviewPage (via dashboard.badges)
     * staleTime: 2 minutes
     * Invalidated by: submitQuiz, completeLesson
     */
    list: () => [...queryKeys.badges.all, 'list'] as const,

    /**
     * Badge progress summary
     * Called on: BadgesPage
     * staleTime: 2 minutes
     */
    progress: () => [...queryKeys.badges.all, 'progress'] as const,
  },

  // ════════════════════════════════════════════════════════════════
  // REWARDS - Coupons, Redemptions, Coins
  // ════════════════════════════════════════════════════════════════
  rewards: {
    /**
     * Base key for all rewards queries
     */
    all: ['rewards'] as const,

    /**
     * Available coupons with optional filters
     * Called on: RewardsPage
     * staleTime: 5 minutes
     * Invalidated by: redeemCoupon (limit decreases)
     */
    coupons: (filters?: { category?: string; min_coins?: number; max_coins?: number }) =>
      filters
        ? [...queryKeys.rewards.all, 'coupons', filters] as const
        : [...queryKeys.rewards.all, 'coupons'] as const,

    /**
     * Single coupon details
     * Called on: RewardDetail
     * staleTime: 5 minutes
     */
    coupon: (couponId: string) =>
      [...queryKeys.rewards.all, 'coupons', couponId] as const,

    /**
     * User's redemption history
     * Called on: RewardsPage
     * staleTime: 2 minutes
     * Invalidated by: redeemCoupon, markRedemptionUsed
     */
    redemptions: (filters?: { limit?: number; offset?: number; active_only?: boolean }) =>
      filters
        ? [...queryKeys.rewards.all, 'redemptions', filters] as const
        : [...queryKeys.rewards.all, 'redemptions'] as const,

    /**
     * Single redemption details
     * Called on: RedemptionDetail
     * staleTime: 5 minutes
     */
    redemption: (redemptionId: string) =>
      [...queryKeys.rewards.all, 'redemptions', redemptionId] as const,

    /**
     * Reward categories (static)
     * Called on: RewardsPage
     * staleTime: 30 minutes
     */
    categories: () => [...queryKeys.rewards.all, 'categories'] as const,

    /**
     * Reward statistics
     * Called on: RewardsPage
     * staleTime: 5 minutes
     * Invalidated by: redeemCoupon
     */
    statistics: () => [...queryKeys.rewards.all, 'statistics'] as const,
  },

  // ════════════════════════════════════════════════════════════════
  // MATERIALS - Resources, Calculators, Checklists
  // ════════════════════════════════════════════════════════════════
  materials: {
    /**
     * Base key for all materials queries
     */
    all: ['materials'] as const,

    /**
     * Material resources with optional filters
     * Called on: MaterialsPage
     * staleTime: 30 minutes (static reference data)
     */
    resources: (filters?: { resource_type?: string; category?: string }) =>
      filters
        ? [...queryKeys.materials.all, 'resources', filters] as const
        : [...queryKeys.materials.all, 'resources'] as const,

    /**
     * Single resource details
     * Called on: ResourceDetail
     * staleTime: 30 minutes
     */
    resource: (resourceId: string) =>
      [...queryKeys.materials.all, 'resources', resourceId] as const,

    /**
     * Available calculators (static)
     * Called on: MaterialsPage
     * staleTime: 1 hour
     */
    calculators: () => [...queryKeys.materials.all, 'calculators'] as const,

    /**
     * Material categories (static)
     * Called on: MaterialsPage
     * staleTime: 1 hour
     */
    categories: () => [...queryKeys.materials.all, 'categories'] as const,

    /**
     * Material checklists (static)
     * Called on: MaterialsPage
     * staleTime: 1 hour
     */
    checklists: () => [...queryKeys.materials.all, 'checklists'] as const,

    /**
     * Materials by type
     * Called on: MaterialsPage
     * staleTime: 30 minutes
     */
    byType: (type: string) => [...queryKeys.materials.all, 'byType', type] as const,
  },

  // ════════════════════════════════════════════════════════════════
  // NOTIFICATIONS - Messages, Unread Count
  // ════════════════════════════════════════════════════════════════
  notifications: {
    /**
     * Base key for all notification queries
     */
    all: ['notifications'] as const,

    /**
     * Notifications list with optional filters
     * Called on: NotificationsPage
     * staleTime: 30 seconds (real-time)
     * Invalidated by: updateNotification, markAllNotificationsRead, deleteNotification
     */
    list: (filters?: {
      unread_only?: boolean;
      notification_type?: string;
      limit?: number;
      offset?: number;
    }) =>
      filters
        ? [...queryKeys.notifications.all, 'list', filters] as const
        : [...queryKeys.notifications.all, 'list'] as const,

    /**
     * Single notification details
     * Called on: NotificationDetail
     * staleTime: 2 minutes
     */
    notification: (notificationId: string) =>
      [...queryKeys.notifications.all, notificationId] as const,

    /**
     * Unread notification count (CRITICAL - shown in header badge)
     * Called on: Header
     * staleTime: 30 seconds (real-time)
     * Invalidated by: updateNotification, markAllNotificationsRead
     */
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'] as const,

    /**
     * Available notification types (static)
     * Called on: NotificationSettings
     * staleTime: 1 hour
     */
    types: () => [...queryKeys.notifications.all, 'types'] as const,

    /**
     * Recent notifications summary
     * Called on: Dashboard
     * staleTime: 2 minutes
     */
    summary: (days?: number) =>
      days
        ? [...queryKeys.notifications.all, 'summary', days] as const
        : [...queryKeys.notifications.all, 'summary', 7] as const,
  },

  // ════════════════════════════════════════════════════════════════
  // HELP - FAQs, Support Tickets, Resources
  // ════════════════════════════════════════════════════════════════
  help: {
    /**
     * Base key for all help queries
     */
    all: ['help'] as const,

    /**
     * FAQs with optional filters
     * Called on: HelpPage, FAQSection
     * staleTime: 30 minutes (static)
     */
    faqs: (filters?: { category?: string; search?: string; limit?: number }) =>
      filters
        ? [...queryKeys.help.all, 'faqs', filters] as const
        : [...queryKeys.help.all, 'faqs'] as const,

    /**
     * Single FAQ details
     * Called on: FAQDetail
     * staleTime: 30 minutes
     */
    faq: (faqId: string) => [...queryKeys.help.all, 'faqs', faqId] as const,

    /**
     * FAQ categories (static - CALLED TWICE currently)
     * Called on: FAQSection, ContactForm
     * staleTime: 1 hour
     */
    categories: () => [...queryKeys.help.all, 'faqCategories'] as const,

    /**
     * User's support tickets with optional filters
     * Called on: HelpPage
     * staleTime: 2 minutes
     * Invalidated by: submitSupportTicket, updateTicket
     */
    tickets: (filters?: { status_filter?: string; limit?: number; offset?: number }) =>
      filters
        ? [...queryKeys.help.all, 'tickets', filters] as const
        : [...queryKeys.help.all, 'tickets'] as const,

    /**
     * Single ticket details
     * Called on: TicketDetail
     * staleTime: 2 minutes
     */
    ticket: (ticketId: string) => [...queryKeys.help.all, 'tickets', ticketId] as const,

    /**
     * Help resources (static)
     * Called on: HelpPage
     * staleTime: 1 hour
     */
    resources: () => [...queryKeys.help.all, 'resources'] as const,

    /**
     * Quick help topics (static)
     * Called on: HelpPage
     * staleTime: 1 hour
     */
    quickHelp: () => [...queryKeys.help.all, 'quickHelp'] as const,

    /**
     * Contact information (static)
     * Called on: HelpPage
     * staleTime: 1 hour
     */
    contactInfo: () => [...queryKeys.help.all, 'contactInfo'] as const,

    /**
     * System status (real-time)
     * Called on: HelpPage
     * staleTime: 30 seconds
     */
    systemStatus: () => [...queryKeys.help.all, 'systemStatus'] as const,

    /**
     * Feedback form structure (static)
     * Called on: FeedbackPage
     * staleTime: 1 hour
     */
    feedbackForm: () => [...queryKeys.help.all, 'feedbackForm'] as const,
  },

  // ════════════════════════════════════════════════════════════════
  // ONBOARDING - Status, Data, Options
  // ════════════════════════════════════════════════════════════════
  onboarding: {
    /**
     * Base key for all onboarding queries
     */
    all: ['onboarding'] as const,

    /**
     * Onboarding completion status (CRITICAL - called 5+ times)
     * Called on: App init, ProtectedRoute, OverviewPage, ModulesPage, OnboardingPage
     * staleTime: 0 (always check fresh - blocks app navigation)
     * Invalidated by: completeStep[1-5], completeOnboarding
     */
    status: () => [...queryKeys.onboarding.all, 'status'] as const,

    /**
     * User's onboarding data/responses
     * Called on: OnboardingPage
     * staleTime: 2 minutes
     * Invalidated by: completeStep[1-5], completeOnboarding
     */
    data: () => [...queryKeys.onboarding.all, 'data'] as const,

    /**
     * Available onboarding options (static - avatars, timelines, etc.)
     * Called on: OnboardingPage
     * staleTime: Infinity (immutable)
     */
    options: () => [...queryKeys.onboarding.all, 'options'] as const,
  },
  minigame: {
    module: (moduleId: string) => ['minigame', 'module', moduleId] as const,
    attempts: (moduleId: string) => ['minigame', 'attempts', moduleId] as const,
    statistics: () => ['minigame', 'statistics'] as const,
  },
  // ════════════════════════════════════════════════════════════════
  // ANALYTICS - User Progress & Admin Lead Management
  // ════════════════════════════════════════════════════════════════
  analytics: {
    /**
     * Base key for all analytics queries
     * Use for invalidating all analytics data
     */
    all: ['analytics'] as const,

    /**
     * Current user's own progress metrics (non-sensitive)
     * Called on: Dashboard, OverviewPage (optional enhancement)
     * staleTime: 2 minutes (engagement level changes with activity)
     * Invalidated by: completeLesson, submitQuiz, submitMinigame
     */
    myProgress: () => [...queryKeys.analytics.all, 'myProgress'] as const,

    // ── Admin-only keys (for future admin dashboard) ──

    /**
     * All leads list with optional filters
     * staleTime: 30 seconds (admin real-time view)
     */
    leads: (filters?: Record<string, any>) =>
      filters
        ? [...queryKeys.analytics.all, 'leads', filters] as const
        : [...queryKeys.analytics.all, 'leads'] as const,

    /**
     * Hot leads quick access
     * staleTime: 30 seconds
     */
    hotLeads: (limit?: number) =>
      limit
        ? [...queryKeys.analytics.all, 'leads', 'hot', limit] as const
        : [...queryKeys.analytics.all, 'leads', 'hot'] as const,

    /**
     * Single lead detail
     * staleTime: 1 minute
     */
    leadDetail: (userId: string) =>
      [...queryKeys.analytics.all, 'leads', userId] as const,

    /**
     * Lead score history for specific user
     * staleTime: 5 minutes
     */
    leadHistory: (userId: string, limit?: number) =>
      limit
        ? [...queryKeys.analytics.all, 'leads', userId, 'history', limit] as const
        : [...queryKeys.analytics.all, 'leads', userId, 'history'] as const,

    /**
     * Aggregate analytics insights
     * staleTime: 1 minute
     */
    insights: () => [...queryKeys.analytics.all, 'insights'] as const,

    /**
     * Comprehensive analytics dashboard
     * staleTime: 1 minute
     */
    dashboard: () => [...queryKeys.analytics.all, 'dashboard'] as const,

    /**
     * Scheduler status
     * staleTime: 30 seconds
     */
    schedulerStatus: () => [...queryKeys.analytics.all, 'scheduler', 'status'] as const,
  },
} as const;

/**
 * Type helper to extract query key type
 * Usage: type CurrentUserKey = QueryKeyType<typeof queryKeys.auth.currentUser>
 */
export type QueryKeyType<T extends (...args: any[]) => readonly any[]> = ReturnType<T>;
