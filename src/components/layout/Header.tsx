import Link from 'next/link';
import { APP_NAME } from '@/constants';

export default function Header() {
  return (
    <header className="bg-white shadow border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold">
            {APP_NAME}
          </Link>
          <nav className="space-x-4">
            <Link href="/courses" className="text-gray-600 hover:text-gray-900">
              Courses
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Login
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
