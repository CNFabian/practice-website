import { OnestFont } from '../../../assets';
import type { BadgeProgress } from '../services/badgesAPI';

interface BadgeHeaderProps {
  progress: BadgeProgress;
}

export const BadgeHeader = ({ progress }: BadgeHeaderProps) => {
  return (
    <div className="text-center mb-8">
      <OnestFont as="h1" weight={700} lineHeight="tight" className="text-4xl text-text-grey mb-4">
        Your Badge Collection
      </OnestFont>
      <OnestFont as="p" weight={300} lineHeight="relaxed" className="text-text-grey mb-6">
        Collect badges by completing modules and achieving milestones in your homeownership journey
      </OnestFont>
      
      <div className="inline-flex items-center justify-center px-6 py-3 text-white rounded-2xl mb-6" style={{background: 'linear-gradient(135deg, #677ae5 0%, #7650a7 100%)'}}>
        <div className="text-center">
          <OnestFont as="div" weight={700} lineHeight="tight" className="text-xl">
            {progress.earned}
          </OnestFont>
          <OnestFont as="div" weight={500} lineHeight="relaxed" className="text-xs opacity-75">
            EARNED
          </OnestFont>
        </div>
        <OnestFont as="div" weight={500} lineHeight="relaxed" className="mx-3 text-lg opacity-50">
          /
        </OnestFont>
        <div className="text-center">
          <OnestFont as="div" weight={700} lineHeight="tight" className="text-xl">
            {progress.total}
          </OnestFont>
          <OnestFont as="div" weight={500} lineHeight="relaxed" className="text-xs opacity-75">
            TOTAL
          </OnestFont>
        </div>
      </div>
    </div>
  );
};