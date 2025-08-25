import Link from 'next/link';
import { APP_NAME } from '@/constants';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-4xl font-bold mb-6">
        Welcome to {APP_NAME}
      </h1>
      <p className="text-lg text-gray-600 mb-8">
        Learn through video courses and earn achievements
      </p>
      <Link 
        href="/courses"
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
      >
        Start Learning
      </Link>
    </main>
  );
}
