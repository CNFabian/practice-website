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
  const handleSceneTransition = (scene: 'MapScene' | 'NeighborhoodScene' | 'HouseScene' | 'LessonView') => {
    if (scene === 'NeighborhoodScene') {
      GameManager.transitionToNeighborhood('downtown', 0);
    } else if (scene === 'MapScene') {
      GameManager.transitionToMap();
    } else if (scene === 'HouseScene') {
      const game = GameManager.getGame();
      const houses = game?.registry.get('neighborhoodHouses')?.['downtown'] || [];
      if (houses.length > 0) {
        const firstHouse = houses[0];
        
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
            // Call handleLessonSelect through the registry
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