import { createSlice, PayloadAction } from '@reduxjs/toolkit';

   export interface QuizQuestion {
     id: number;
     question: string;
     options: {
       id: string;
       text: string;
       isCorrect: boolean;
     }[];
     explanation: {
       correct: string;
       incorrect: {
         [key: string]: {
           why_wrong: string;
           confusion_reason: string;
         };
       };
     };
   }

   export interface QuizState {
     currentQuestion: number;
     selectedAnswer: string | null;
     showFeedback: boolean;
     answers: { [questionIndex: number]: string };
     showResults: boolean;
     score: number;
     isTransitioning: boolean;
     isActive: boolean;
     questions: QuizQuestion[];
     quizType: 'lesson' | 'module' | 'minigame';
     previousQuestionData: QuizQuestion | null;
     previousQuestionNumber: number;
     previousSelectedAnswer: string | null;
   }

   const initialQuizState: QuizState = {
     currentQuestion: 0,
     selectedAnswer: null,
     showFeedback: false,
     answers: {},
     showResults: false,
     score: 0,
     isTransitioning: false,
     isActive: false,
     questions: [],
     quizType: 'lesson',
     previousQuestionData: null,
     previousQuestionNumber: 0,
     previousSelectedAnswer: null,
   };

   const quizSlice = createSlice({
     name: 'quiz',
     initialState: initialQuizState,
     reducers: {
     // Copy all the quiz-related reducers from moduleSlice.ts here
     // We'll update this after we see the current moduleSlice structure
     }
   });

   export const quizActions = quizSlice.actions;
   export default quizSlice.reducer;