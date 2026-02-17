import type { HousePosition, BackendLessonData, ModuleLessonsData } from '../types';

/**
 * Generate a stable frontend ID from a backend UUID
 */
export function generateFrontendId(uuid: string, offset: number = 10000): number {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    const char = uuid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) + offset;
}

/**
 * Calculate house position based on index
 */
export function calculateHousePosition(index: number): { x: number; y: number } {
  const positions = [
    { x: 20, y: 40 },
    { x: 45, y: 45 },
    { x: 70, y: 50 },
    { x: 85, y: 55 }
  ];
  return positions[index % positions.length];
}

/**
 * Transform backend modules to house positions
 */
export function transformModulesToHouses(modulesData: any[]): Record<string, HousePosition[]> {
  if (!modulesData || !Array.isArray(modulesData)) {
    console.warn('⚠️ No modules data available');
    return { downtown: [] };
  }

  console.log(`✅ Transforming ${modulesData.length} modules to house structure`);

  const housesData: Record<string, HousePosition[]> = {
    downtown: modulesData.map((module: any, index: number) => {
      const position = calculateHousePosition(index);
      const houseType = `house${(index % 4) + 1}`;
      const frontendId = generateFrontendId(module.id || `module-${index}`, 10000);
      
      return {
        id: `house${index + 1}`,
        name: module.title || `Module ${index + 1}`,
        x: position.x,
        y: position.y,
        moduleId: frontendId,
        moduleBackendId: module.id,
        isLocked: module.is_locked !== undefined ? module.is_locked : false,
        houseType: houseType,
        description: module.description || '',
        coinReward: module.nest_coins_reward || 0
      };
    })
  };

  console.log('🏠 House data created from modules:', housesData);
  return housesData;
}

/**
 * Transform backend lessons to frontend format
 */
export function transformBackendLessonsToFrontend(
  lessonsData: BackendLessonData[],
  moduleId: number,
  moduleName: string
): ModuleLessonsData {
  if (!Array.isArray(lessonsData)) {
    console.warn('⚠️ Invalid lessons data from backend');
    return {
      id: moduleId,
      title: moduleName,
      lessons: []
    };
  }

  console.log(`✅ Transforming ${lessonsData.length} lessons for module ${moduleId}`);

  return {
    id: moduleId,
    title: moduleName,
    lessons: lessonsData.map((lesson: BackendLessonData, index: number) => {
      const frontendId = generateFrontendId(lesson.id || `lesson-${index}`, 20000);

      return {
        id: frontendId,
        backendId: lesson.id,
        title: lesson.title || `Lesson ${index + 1}`,
        type: 'Video/Reading',
        completed: lesson.is_completed || false,
        locked: false,
        duration: `${lesson.estimated_duration_minutes || 10} min`,
        description: lesson.description || '',
        image: lesson.image_url || '/placeholder-lesson.jpg',
        coins: lesson.nest_coins_reward || 0,
        videoUrl: lesson.video_url || '',
        grow_your_nest_played: lesson.grow_your_nest_played || false,
      };
    })
  };
}