import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/index'
import { SidebarProvider, useSidebar } from '../contexts/SidebarContext'
import { useWalkthrough } from '../contexts/WalkthroughContext'
import ModuleWalkthrough from '../components/protected/walkthrough/ModuleWalkthrough'
import GameManager from '../pages/protected/modules/phaser/managers/GameManager'
import { getModuleLessons } from '../services/learningAPI';

const MainLayoutContent: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const { isWalkthroughActive, exitWalkthrough, completeWalkthrough } = useWalkthrough();

  // Handle scene transitions for walkthrough
  const handleSceneTransition = (scene: 'MapScene' | 'NeighborhoodScene' | 'HouseScene' | 'LessonView' | 'GrowYourNestMinigame') => {
    console.log('🎬 Walkthrough: handleSceneTransition called with:', scene);
    
    if (scene === 'NeighborhoodScene') {
      // Call the React navigation handler to update navState (which updates background)
      const game = GameManager.getGame();
      const handleNeighborhoodSelect = game?.registry.get('handleNeighborhoodSelect');
      if (handleNeighborhoodSelect) {
        console.log('🎬 Walkthrough: Calling handleNeighborhoodSelect to sync navState');
        handleNeighborhoodSelect('downtown');
      }
      
      // Also transition the Phaser scene
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
      
      // Reset navState to map via handleBackToMap (which IS registered)
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
        
        // Call the React navigation handler to update navState (which updates background)
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
      
      // Step 1: Dismiss the LessonView React overlay by setting navState to 'house'
      // handleMinigameSelect sets currentView='minigame' which shows the React Minigame overlay
      // Instead, we want to go back to 'house' view so only the Phaser canvas is visible
      const handleBackToHouse = game.registry.get('handleBackToHouse');
      const handleMinigameSelect = game.registry.get('handleMinigameSelect');
      
      // Try handleBackToHouse first (dismisses LessonView, goes back to house view)
      if (handleBackToHouse) {
        console.log('🎬 Walkthrough: Calling handleBackToHouse');
        handleBackToHouse();
      } else if (handleMinigameSelect) {
        // Fallback: handleMinigameSelect at least dismisses LessonView
        console.log('🎬 Walkthrough: handleBackToHouse not found, using handleMinigameSelect');
        handleMinigameSelect();
      } else {
        console.error('❌ Walkthrough: No handler found to dismiss LessonView');
      }

      // Step 2: Directly start the GrowYourNestMinigame Phaser scene
      // Don't wait for HouseScene — just start the minigame scene directly
      setTimeout(() => {
        console.log('🎬 Walkthrough: Directly starting GrowYourNestMinigame scene');
        
        // Check what scenes are currently active for debugging
        const scenes = game.scene.getScenes(true);
        console.log('📋 Active scenes:', scenes.map((s: any) => s.scene.key));
        
        try {
          // Stop any currently running scene that would conflict
          const activeScenes = game.scene.getScenes(true);
          for (const s of activeScenes) {
            const key = (s as any).scene.key;
            if (key !== 'PreloaderScene') {
              console.log(`🎬 Walkthrough: Stopping scene: ${key}`);
              game.scene.stop(key);
            }
          }
          
          // Start GrowYourNestMinigame directly
          game.scene.start('GrowYourNestMinigame');
          console.log('✅ Walkthrough: GrowYourNestMinigame started!');
        } catch (e) {
          console.error('❌ Walkthrough: Error starting GrowYourNestMinigame:', e);
        }
      }, 500);
      
    } else if (scene === 'LessonView') {
      // Trigger lesson select for the first lesson of the first module
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