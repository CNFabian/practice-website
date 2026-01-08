import React from 'react';
   import { Module, Lesson } from '../../../types/modules';

   interface ModulesViewProps {
     modulesData: Module[];
     onLessonSelect: (lesson: Lesson, module: Module) => void;
     onModuleQuizSelect?: (module: Module) => void;
     isTransitioning?: boolean;
     onLessonsUpdate?: (moduleId: number, lessons: Lesson[]) => void;
   }

   const ModulesView: React.FC<ModulesViewProps> = ({
     modulesData,
     onLessonSelect,
     onModuleQuizSelect,
     isTransitioning = false,
     onLessonsUpdate
   }) => {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
         <div className="text-center p-8">
           <h2 className="text-2xl font-bold text-gray-900 mb-4">
             🗺️ New Module Experience Coming Soon
           </h2>
           <p className="text-gray-600 mb-6">
             We're building an exciting map-based learning journey!
           </p>
           <div className="bg-white p-6 rounded-lg shadow-sm border">
             <h3 className="font-semibold text-gray-800 mb-2">Coming Features:</h3>
             <ul className="text-left text-gray-600 space-y-1">
               <li>🏘️ Interactive neighborhood map</li>
               <li>🏠 Learning houses with lessons</li>
               <li>🪙 Coin collection system</li>
               <li>🎮 Educational minigames</li>
               <li>🏆 Regional leaderboards</li>
             </ul>
           </div>
           <p className="text-sm text-gray-500 mt-4">
             Available modules: {modulesData.length}
           </p>
         </div>
       </div>
     );
   };

   export default ModulesView;