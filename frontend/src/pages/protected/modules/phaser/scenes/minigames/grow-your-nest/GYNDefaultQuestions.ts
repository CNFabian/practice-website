import type { InternalQuestion } from './GYNTypes';

export function getDefaultQuestions(): InternalQuestion[] {
  return [
    {
      id: '1',
      question: 'What is a down payment?',
      options: [
        { letter: 'A', text: 'The monthly payment on a mortgage', answerId: '' },
        { letter: 'B', text: 'The initial upfront payment when buying a home', answerId: '' },
        { letter: 'C', text: 'The final payment to close a loan', answerId: '' },
        { letter: 'D', text: 'A penalty for early loan repayment', answerId: '' },
      ],
      correctAnswer: 'B',
      explanation: '',
    },
    {
      id: '2',
      question: 'What does APR stand for?',
      options: [
        { letter: 'A', text: 'Annual Payment Rate', answerId: '' },
        { letter: 'B', text: 'Adjusted Percentage Rate', answerId: '' },
        { letter: 'C', text: 'Annual Percentage Rate', answerId: '' },
        { letter: 'D', text: 'Approved Payment Ratio', answerId: '' },
      ],
      correctAnswer: 'C',
      explanation: '',
    },
    {
      id: '3',
      question: "What is home equity?",
      options: [
        { letter: 'A', text: 'The total value of your home', answerId: '' },
        { letter: 'B', text: "The difference between your home's value and what you owe", answerId: '' },
        { letter: 'C', text: 'The interest rate on your mortgage', answerId: '' },
        { letter: 'D', text: 'The cost of home insurance', answerId: '' },
      ],
      correctAnswer: 'B',
      explanation: '',
    },
  ];
}