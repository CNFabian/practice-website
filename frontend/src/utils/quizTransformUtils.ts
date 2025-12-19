import { useMemo } from 'react';

export interface BackendQuizQuestion {
  id: string;
  lesson_id: string;
  question_text: string;
  question_type: string;
  explanation: string;
  order_index: number;
  answers: {
    id: string;
    question_id: string;
    answer_text: string;
    order_index: number;
  }[];
}

export interface TransformedQuizQuestion {
  id: number;
  question: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation: {
    correct: string;
    incorrect: Record<string, { why_wrong: string }>;
  };
}

// Pure transformation function (no React dependencies)
export const transformQuizQuestions = (
  backendQuestions: BackendQuizQuestion[]
): TransformedQuizQuestion[] => {
  if (!backendQuestions || !Array.isArray(backendQuestions)) {
    return [];
  }

  return backendQuestions.map((q: BackendQuizQuestion, index: number) => {
    // Sort answers by order_index to ensure correct answer is first
    const sortedAnswers = [...q.answers].sort((a, b) => a.order_index - b.order_index);
    
    // Generate option IDs (a, b, c, d, etc.)
    const options = sortedAnswers.map((answer, answerIndex) => ({
      id: String.fromCharCode(97 + answerIndex), // 'a', 'b', 'c', 'd'
      text: answer.answer_text,
      isCorrect: answerIndex === 0 // Backend puts correct answer first after sorting
    }));

    // Generate explanations for incorrect answers
    const incorrectExplanations = Object.fromEntries(
      options.slice(1).map(option => [
        option.id,
        { 
          why_wrong: `This is not correct. The right answer is "${options[0].text}". ${q.explanation ? 'Please review: ' + q.explanation : ''}`.trim()
        }
      ])
    );

    return {
      id: index + 1,
      question: q.question_text,
      options,
      explanation: {
        correct: q.explanation || "Correct! Well done.",
        incorrect: incorrectExplanations
      }
    };
  });
};

// React hook for memoized transformation
export const useTransformedQuizQuestions = (
  backendQuestions: BackendQuizQuestion[] | null | undefined
): TransformedQuizQuestion[] | null => {
  return useMemo(() => {
    if (!backendQuestions || backendQuestions.length === 0) {
      return null;
    }

    console.log('🔄 Transforming quiz questions (memoized):', backendQuestions.length);
    const startTime = performance.now();
    
    const transformed = transformQuizQuestions(backendQuestions);
    
    const endTime = performance.now();
    console.log(`✅ Quiz transformation completed in ${(endTime - startTime).toFixed(2)}ms`);
    
    return transformed;
  }, [backendQuestions]);
};

// Validation helper
export const validateQuizData = (data: any): data is BackendQuizQuestion[] => {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => 
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.question_text === 'string' &&
    Array.isArray(item.answers) &&
    item.answers.length > 0 &&
    item.answers.every((answer: any) => 
      typeof answer.answer_text === 'string' &&
      typeof answer.order_index === 'number'
    )
  );
};

// Performance monitoring wrapper
export const withQuizPerformanceLogging = <T extends any[], R>(
  fn: (...args: T) => R,
  operationName: string
) => {
  return (...args: T): R => {
    const startTime = performance.now();
    const result = fn(...args);
    const endTime = performance.now();
    
    console.log(`⚡ ${operationName} completed in ${(endTime - startTime).toFixed(2)}ms`);
    return result;
  };
};