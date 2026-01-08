import { useState, useEffect } from 'react';
   import { useModules as useModulesQuery } from '../queries/useLearningQueries';
   import { useOnboardingStatus } from '../queries/useOnboardingStatus';
   import { convertBackendModuleToFrontend } from '../../services/modules/dataAdapters';
   import { Module } from '../../types/modules.backup';

   export const useModulesData = () => {
     const { data: onboardingStatusData } = useOnboardingStatus();
     const { data: backendModules, isLoading: isLoadingModules, error: modulesError } = useModulesQuery();
     const [modulesData, setModulesData] = useState<Module[]>([]);

     useEffect(() => {
       if (backendModules && Array.isArray(backendModules)) {
         const convertedModules = backendModules.map(convertBackendModuleToFrontend);
         setModulesData(convertedModules);
       }
     }, [backendModules]);

     return {
       modulesData,
       onboardingStatus: onboardingStatusData,
       isLoadingModules,
       modulesError
     };
   };