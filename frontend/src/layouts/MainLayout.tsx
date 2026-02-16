import React, { useState, useEffect, useCallback } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/index'
import { SidebarProvider, useSidebar } from '../contexts/SidebarContext'
import { useWalkthrough } from '../contexts/WalkthroughContext'
import ModuleWalkthrough from '../components/protected/walkthrough/ModuleWalkthrough'
import FreeRoamUnlockModal from '../components/protected/modals/FreeroamUnlockModal'
import GameManager from '../pages/protected/modules/phaser/managers/GameManager'
import { getModuleLessons } from '../services/learningAPI';
import { getLessonQuestions, transformGYNQuestionsForMinigame } from '../services/growYourNestAPI';

const MainLayoutContent: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const { isWalkthroughActive, exitWalkthrough, completeWalkthrough } = useWalkthrough();

  // ═══════════════════════════════════════════════════════════
  // FREE ROAM UNLOCK MODAL — Registry bridge from HouseScene
  // ═══════════════════════════════════════════════════════════
  const [showFreeRoamModal, setShowFreeRoamModal] = useState(false);

  useEffect(() => {
    const game = GameManager.getGame();
    if (!game) return;

    const handleRegistryChange = (_parent: any, _key: string, value: any) => {
      if (value) {
        console.log('🌳 [MainLayout] Free Roam unlock signal received for module:', value);
        setShowFreeRoamModal(true);
      }
    };

    game.registry.events.on('changedata-showFreeRoamUnlockModal', handleRegistryChange);

    return () => {
      game.registry.events.off('changedata-showFreeRoamUnlockModal', handleRegistryChange);
    };
  }, []);

  const handleLaunchFreeRoam = useCallback(() => {
    setShowFreeRoamModal(false);

    const game = GameManager.getGame();
    if (game) {
      // Clear the registry signal
      game.registry.set('showFreeRoamUnlockModal', null);

      const houseScene = game.scene.getScene('HouseScene') as any;
      if (houseScene && houseScene.launchFreeRoamFromReact) {
        houseScene.launchFreeRoamFromReact();
        console.log('🌳 [MainLayout] Free Roam launch triggered via HouseScene');
      } else {
        console.error('🌳 [MainLayout] HouseScene or launchFreeRoamFromReact not found');
      }
    }
  }, []);

  const handleDismissFreeRoam = useCallback(() => {
    setShowFreeRoamModal(false);

    const game = GameManager.getGame();
    if (game) {
      game.registry.set('showFreeRoamUnlockModal', null);
    }
  }, []);

  // Handle scene transitions for walkthrough
  const handleSceneTransition = (scene: 'MapScene' | 'NeighborhoodScene' | 'HouseScene' | 'LessonView' | 'GrowYourNestMinigame') => {
    console.log('🎬 Walkthrough: handleSceneTransition called with:', scene);
    
    if (scene === 'NeighborhoodScene') {
      const game = GameManager.getGame();
      const handleNeighborhoodSelect = game?.registry.get('handleNeighborhoodSelect');
      if (handleNeighborhoodSelect) {
        console.log('🎬 Walkthrough: Calling handleNeighborhoodSelect to sync navState');
        handleNeighborhoodSelect('downtown');
      }
      GameManager.transitionToNeighborhood('downtown', 0);
    } else if (scene === 'MapScene') {
      const game = GameManager.getGame();

      // Stop GrowYourNestMinigame if it's running
      try {
        const minigameScene = game?.scene.getScene('GrowYourNestMinigame');
        if (minigameScene && minigameScene.scene.isActive()) {
          console.log('🎬 Walkthrough: Stopping GrowYourNestMinigame');
          game!.scene.stop('GrowYourNestMinigame');
        }
      } catch (e) { /* scene may not exist yet */ }

      // Reset navState to map via handleBackToMap
      const handleBackToMap = game?.registry.get('handleBackToMap');
      if (handleBackToMap) {
        console.log('🎬 Walkthrough: Calling handleBackToMap');
        handleBackToMap();
      }

      setTimeout(() => {
        GameManager.transitionToMap();
      }, 100);
    } else if (scene === 'HouseScene') {
      const game = GameManager.getGame();
      const houses = game?.registry.get('neighborhoodHouses')?.['downtown'] || [];

      if (houses.length > 0) {
        const firstHouse = houses[0];

        const handleHouseSelect = game?.registry.get('handleHouseSelect');
        if (handleHouseSelect) {
          console.log('🎬 Walkthrough: Calling handleHouseSelect to sync navState');
          handleHouseSelect(firstHouse.id, firstHouse.moduleBackendId);
        }

        if (firstHouse.moduleBackendId && !GameManager.hasLessonsData(firstHouse.moduleBackendId)) {
          getModuleLessons(firstHouse.moduleBackendId).then((lessonsData) => {
            if (lessonsData && Array.isArray(lessonsData)) {
              GameManager.updateLessonsData(firstHouse.moduleBackendId, lessonsData);
            }
            GameManager.transitionToHouse(firstHouse.id, firstHouse.moduleBackendId);
          }).catch(() => {
            GameManager.transitionToHouse(firstHouse.id, firstHouse.moduleBackendId);
          });
        } else {
          GameManager.transitionToHouse(firstHouse.id, firstHouse.moduleBackendId);
        }
      }
    } else if (scene === 'GrowYourNestMinigame') {
      const game = GameManager.getGame();
      if (!game) {
        console.error('❌ Walkthrough: No Phaser game instance found');
        return;
      }

      console.log('🎬 Walkthrough: Starting GrowYourNestMinigame transition');

      // Step 0: Ensure Tier 3 (Deferred) assets are loaded before launching minigame
      // The walkthrough bypasses ModulesPage's useEffect that normally triggers this
      GameManager.loadDeferredAssets();

      // Step 1: Dismiss the LessonView React overlay
      const handleBackToHouse = game.registry.get('handleBackToHouse');
      if (handleBackToHouse) {
        console.log('🎬 Walkthrough: Calling handleBackToHouse to dismiss LessonView');
        handleBackToHouse();
      }

      // Step 2: After LessonView dismisses, prepare and launch the minigame
      setTimeout(async () => {
        try {
          // Stop conflicting scenes
          const activeScenes = game.scene.getScenes(true);
          console.log('📋 Active scenes before GYN launch:', activeScenes.map((s: any) => s.scene.key));
          for (const s of activeScenes) {
            const key = (s as any).scene.key;
            if (key !== 'PreloaderScene') {
              console.log(`🎬 Walkthrough: Stopping scene: ${key}`);
              game.scene.stop(key);
            }
          }

          // Get the first house and its moduleBackendId
          const houses = game.registry.get('neighborhoodHouses')?.['downtown'] || [];
          console.log('🏠 Walkthrough: Houses available:', houses.length);

          if (houses.length === 0) {
            console.error('❌ Walkthrough: No houses found in registry');
            return;
          }

          const firstHouse = houses[0];
          const moduleBackendId = firstHouse.moduleBackendId;
          console.log('🏠 Walkthrough: First house moduleBackendId:', moduleBackendId);

          if (!moduleBackendId) {
            console.error('❌ Walkthrough: No moduleBackendId on first house');
            return;
          }

          // Get lessons data - first check registry, then fetch if needed
          let moduleLessonsData = game.registry.get('moduleLessonsData') || {};
          let moduleData = moduleLessonsData[moduleBackendId];
          console.log('📚 Walkthrough: Module lessons in registry:', moduleData ? `${moduleData.lessons?.length} lessons` : 'NOT FOUND');

          // If lessons not in registry, fetch them
          if (!moduleData || !moduleData.lessons || moduleData.lessons.length === 0) {
            console.log('📚 Walkthrough: Fetching lessons for module:', moduleBackendId);
            try {
              const lessonsData = await getModuleLessons(moduleBackendId);
              if (lessonsData && Array.isArray(lessonsData) && lessonsData.length > 0) {
                GameManager.updateLessonsData(moduleBackendId, lessonsData);
                // Re-read from registry after update
                moduleLessonsData = game.registry.get('moduleLessonsData') || {};
                moduleData = moduleLessonsData[moduleBackendId];
                console.log('📚 Walkthrough: Fetched and stored lessons:', moduleData?.lessons?.length);
              }
            } catch (fetchError) {
              console.error('❌ Walkthrough: Failed to fetch lessons:', fetchError);
            }
          }

          // Get the first lesson's backendId (UUID)
          let lessonBackendId: string | null = null;
          if (moduleData?.lessons?.length > 0) {
            lessonBackendId = moduleData.lessons[0].backendId;
            console.log('📝 Walkthrough: First lesson backendId:', lessonBackendId);
          }

          // Try to fetch real GYN questions, fall back to demo data for walkthrough
          let launched = false;

          if (lessonBackendId && !/^\d+$/.test(lessonBackendId)) {
            try {
              console.log(`🌳 Walkthrough: Fetching GYN questions for lesson: ${lessonBackendId}`);
              const questionsResponse = await getLessonQuestions(lessonBackendId);
              console.log('🌳 Walkthrough: GYN questions received:', questionsResponse.questions.length);

              if (questionsResponse.questions.length > 0) {
                const transformedQuestions = transformGYNQuestionsForMinigame(questionsResponse.questions);

                const initData = {
                  mode: 'lesson' as const,
                  lessonId: lessonBackendId,
                  moduleId: moduleBackendId,
                  questions: transformedQuestions,
                  treeState: questionsResponse.tree_state,
                  moduleNumber: 1,
                  showStartScreen: true,
                };

                console.log('✅ Walkthrough: Launching GrowYourNestMinigame with real lesson data');
                game.scene.start('GrowYourNestMinigame', initData);
                launched = true;
              }
            } catch (apiError) {
              console.warn('⚠️ Walkthrough: API rejected GYN questions (likely lesson not completed), using demo data');
            }
          }

          // Fallback: use demo walkthrough data so the minigame scene renders for the tour
          if (!launched) {
            console.log('🎯 Walkthrough: Launching GrowYourNestMinigame with demo walkthrough data');

            const walkthroughDemoData = {
              mode: 'lesson' as const,
              lessonId: lessonBackendId || 'walkthrough-demo',
              moduleId: moduleBackendId || 'walkthrough-demo',
              questions: [
                {
                  id: 'wt-q1',
                  question: 'What is the first step in buying a home?',
                  options: [
                    { letter: 'A', text: 'Get pre-approved for a mortgage', answerId: 'wt-a1a' },
                    { letter: 'B', text: 'Start looking at houses', answerId: 'wt-a1b' },
                    { letter: 'C', text: 'Hire a moving company', answerId: 'wt-a1c' },
                  ],
                  correctAnswerId: null,
                  explanation: 'Getting pre-approved helps you understand your budget before house hunting.',
                },
                {
                  id: 'wt-q2',
                  question: 'What does a home inspection check for?',
                  options: [
                    { letter: 'A', text: 'The home\'s market value', answerId: 'wt-a2a' },
                    { letter: 'B', text: 'Structural issues and defects', answerId: 'wt-a2b' },
                    { letter: 'C', text: 'The neighborhood crime rate', answerId: 'wt-a2c' },
                  ],
                  correctAnswerId: null,
                  explanation: 'A home inspection identifies potential problems with the property\'s condition.',
                },
                {
                  id: 'wt-q3',
                  question: 'What is earnest money?',
                  options: [
                    { letter: 'A', text: 'A deposit showing you\'re serious about buying', answerId: 'wt-a3a' },
                    { letter: 'B', text: 'The down payment on the home', answerId: 'wt-a3b' },
                    { letter: 'C', text: 'Money paid to the real estate agent', answerId: 'wt-a3c' },
                  ],
                  correctAnswerId: null,
                  explanation: 'Earnest money is a good faith deposit that shows the seller you\'re committed.',
                },
              ],
              treeState: {
                growth_points: 0,
                current_stage: 0,
                total_stages: 5,
                points_per_stage: 50,
                completed: false,
              },
              moduleNumber: 1,
              showStartScreen: true,
            };

            game.scene.start('GrowYourNestMinigame', walkthroughDemoData);
          }
          
        } catch (error) {
          console.error('❌ Walkthrough: Error during GrowYourNestMinigame launch:', error);
        }
      }, 500);
    } else if (scene === 'LessonView') {
      const game = GameManager.getGame();
      const houses = game?.registry.get('neighborhoodHouses')?.['downtown'] || [];

      if (houses.length > 0) {
        const firstHouse = houses[0];
        const moduleBackendId = firstHouse.moduleBackendId;

        if (moduleBackendId) {
          const moduleLessonsData = game?.registry.get('moduleLessonsData') || {};
          const moduleData = moduleLessonsData[moduleBackendId];

          if (moduleData && moduleData.lessons && moduleData.lessons.length > 0) {
            const firstLesson = moduleData.lessons[0];
            const handleLessonSelect = game?.registry.get('handleLessonSelect');
            if (handleLessonSelect) {
              handleLessonSelect(firstLesson.id, moduleBackendId);
            }
          }
        }
      }
    }
  };

  return (
    <div className="min-h-screen overflow-hidden">
      <Sidebar />

      {/* Background layer - full viewport, behind content */}
      <div className="fixed inset-0 -z-10" id="section-background"></div>

      {/* Content layer - with dynamic padding based on sidebar state */}
      <main
        className={`h-screen overflow-hidden relative z-0 transition-[padding] duration-300 ease-in-out ${
          isCollapsed ? 'pl-20' : 'pl-48'
        }`}
      >
        <Outlet />
      </main>
      
      <ModuleWalkthrough
        isActive={isWalkthroughActive}
        onExit={exitWalkthrough}
        onComplete={completeWalkthrough}
        onSceneTransition={handleSceneTransition}
      />

      <FreeRoamUnlockModal
        isOpen={showFreeRoamModal}
        onLaunchFreeRoam={handleLaunchFreeRoam}
        onDismiss={handleDismissFreeRoam}
      />
    </div>
  )
}

const MainLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <MainLayoutContent />
    </SidebarProvider>
  )
}

export default MainLayout