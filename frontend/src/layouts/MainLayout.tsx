import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from '../components/index'
import { SidebarProvider, useSidebar } from '../contexts/SidebarContext'
import { useWalkthrough } from '../contexts/WalkthroughContext'
import ModuleWalkthrough from '../components/protected/walkthrough/ModuleWalkthrough'
import GameManager from '../pages/protected/modules/phaser/managers/GameManager'

const MainLayoutContent: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const { isWalkthroughActive, exitWalkthrough, completeWalkthrough } = useWalkthrough();

  // Handle scene transitions for walkthrough
  const handleSceneTransition = (scene: 'MapScene' | 'NeighborhoodScene') => {
    if (scene === 'NeighborhoodScene') {
      // Transition to the first neighborhood (Home-Buying Knowledge)
      GameManager.transitionToNeighborhood('downtown', 0);
    } else if (scene === 'MapScene') {
      GameManager.transitionToMap();
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