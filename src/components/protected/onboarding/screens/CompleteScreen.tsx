export const CompleteScreen: React.FC = () => {
  return (
    <div className="text-center py-8">
      <div className="mb-6">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">You're All Set!</h3>
        <p className="text-gray-600">
          Your profile is complete and you're ready to start your homeownership journey.
        </p>
      </div>
      
      <div className="bg-indigo-50 rounded-lg p-6 max-w-md mx-auto">
        <h4 className="font-semibold text-indigo-900 mb-3">What's Next?</h4>
        <ul className="text-left text-sm text-indigo-800 space-y-2">
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Explore personalized learning modules</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Complete lessons to earn rewards</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Track your progress on the dashboard</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">✓</span>
            <span>Connect with experts when you need help</span>
          </li>
        </ul>
      </div>
    </div>
  )
}