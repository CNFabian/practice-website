export const ShareScreen: React.FC = () => {
  const shareUrl = window.location.origin
  const shareText = 'I\'m on my journey to homeownership with Nest Navigate!'

  const handleShare = (platform: string) => {
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      email: `mailto:?subject=${encodeURIComponent('Check out Nest Navigate')}&body=${encodeURIComponent(shareText + ' ' + shareUrl)}`
    }
    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400')
    }
  }

  return (
    <div className="text-center">
      <div className="mb-6">
        <div className="text-6xl mb-4">🏠</div>
        <p className="text-gray-600">Share your exciting journey with friends and family!</p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          onClick={() => handleShare('twitter')}
          className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all"
        >
          <div className="text-2xl mb-2">🐦</div>
          <div className="text-sm font-medium">Twitter</div>
        </button>
        
        <button
          onClick={() => handleShare('facebook')}
          className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-600 hover:bg-blue-50 transition-all"
        >
          <div className="text-2xl mb-2">📘</div>
          <div className="text-sm font-medium">Facebook</div>
        </button>
        
        <button
          onClick={() => handleShare('linkedin')}
          className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-700 hover:bg-blue-50 transition-all"
        >
          <div className="text-2xl mb-2">💼</div>
          <div className="text-sm font-medium">LinkedIn</div>
        </button>
        
        <button
          onClick={() => handleShare('email')}
          className="p-4 rounded-lg border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all"
        >
          <div className="text-2xl mb-2">✉️</div>
          <div className="text-sm font-medium">Email</div>
        </button>
      </div>
    </div>
  )
}