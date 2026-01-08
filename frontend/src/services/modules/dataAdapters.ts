import { Module, Lesson } from '../../types/modules.backup';

   // Backend lesson data interface
   export interface BackendLessonData {
     id: string;
     module_id: string;
     title: string;
     description: string;
     image_url: string;
     video_url: string;
     estimated_duration_minutes: number;
     nest_coins_reward: number;
     is_completed: boolean;
     progress_seconds: number;
   }

   // Helper function to convert backend lesson to frontend format
   export const convertBackendLessonToFrontend = (backendLesson: BackendLessonData, index: number): Lesson => {
     const generateUniqueId = (uuid: string, fallbackIndex: number): number => {
       if (!uuid) return fallbackIndex + 1000;
       
       let hash = 0;
       for (let i = 0; i < uuid.length; i++) {
         const char = uuid.charCodeAt(i);
         hash = ((hash << 5) - hash) + char;
         hash = hash & hash;
       }
       
       return Math.abs(hash) + 10000;
     };

     return {
       id: generateUniqueId(backendLesson.id, index),
       backendId: backendLesson.id,
       image: backendLesson.image_url || '/default-lesson-image.jpg',
       title: backendLesson.title,
       duration: `${backendLesson.estimated_duration_minutes} min`,
       description: backendLesson.description,
       coins: backendLesson.nest_coins_reward,
       completed: backendLesson.is_completed,
       videoUrl: backendLesson.video_url
     };
   };

   // Add the module converter function here too if you have one
   export const convertBackendModuleToFrontend = (backendModule: any): Module => {
     return {
       id: parseInt(backendModule.id.slice(-1)) || Math.floor(Math.random() * 1000),
       backendId: backendModule.id,
       image: backendModule.thumbnail_url || '/default-module-image.jpg',
       title: backendModule.title,
       description: backendModule.description,
       lessonCount: backendModule.lesson_count || 0,
       status: backendModule.progress_percentage === "100" ? 'Completed' : 
               backendModule.progress_percentage === "0" ? 'Not Started' : 'In Progress',
       tags: [backendModule.difficulty_level || 'Beginner'],
       illustration: backendModule.illustration || "default",
       lessons: []
     };
   };