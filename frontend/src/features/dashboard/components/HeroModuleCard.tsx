import React from "react";
import { OnestFont } from "../../../assets";
import { Icons } from "../images";
import { BetaTooltip } from "../../../components";

interface HeroModuleCardProps {
  moduleTitle: string;
  moduleDescription: string;
  tags: string[];
  coinReward: number;
  progressPercentage: number;
  estimatedMinutesRemaining: number;
  thumbnailUrl: string;
  onContinue: () => void;
}

const HeroModuleCard: React.FC<HeroModuleCardProps> = ({
  moduleTitle,
  moduleDescription,
  tags,
  coinReward,
  progressPercentage,
  estimatedMinutesRemaining,
  thumbnailUrl,
}) => {
  return (
    <div className="bg-card-gradient rounded-2xl overflow-hidden">
      {/* Top Section — Gradient background with content + thumbnail */}
      <div className="bg-linear-blue-1 relative">
        <div className="flex">
          {/* Left Content */}
          <div className="flex-1 p-5 lg:p-6 z-10">
            {/* Module Title */}
            <OnestFont
              as="h2"
              weight={700}
              lineHeight="tight"
              className="text-pure-white text-xl lg:text-2xl mb-3"
            >
              {moduleTitle}
            </OnestFont>

            {/* Description */}
            <OnestFont
              as="p"
              weight={300}
              lineHeight="relaxed"
              className="text-pure-white/80 text-sm mb-4 max-w-[340px]"
            >
              {moduleDescription}
            </OnestFont>

            {/* Tags + Coin Reward */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Difficulty Tag (first tag only) */}
              {tags.length > 0 && (
                <span className="border border-pure-white/40 text-pure-white px-4 py-1 rounded-full text-xs">
                  <OnestFont weight={500} lineHeight="relaxed">
                    {tags[0]}
                  </OnestFont>
                </span>
              )}

              {/* Coin Reward */}
              <span
                className="text-text-blue-black px-4 py-1 rounded-full text-xs flex items-center gap-1"
                style={{ backgroundColor: "#FEE8B8" }}
              >
                <OnestFont weight={700} lineHeight="relaxed">
                  {coinReward}
                </OnestFont>
                <img src={Icons.NestCoin} alt="Coin" className="w-5 h-5" />
              </span>
            </div>
          </div>

          {/* Right Thumbnail */}
          <div className="hidden sm:flex w-[240px] lg:w-[300px] flex-shrink-0 items-center justify-center pl-0 pr-4 py-4">
            <img
              src={thumbnailUrl}
              alt={moduleTitle}
              className="w-full h-auto object-contain rounded-xl"
            />
          </div>
        </div>
      </div>

      {/* Bottom Section — Progress + Continue Button */}
      <div className="p-5 lg:px-6 lg:pb-5 lg:pt-4">
        {/* Progress Row */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-1">
            {/* Progress Bar */}
            <div className="flex-1 h-3 bg-unavailable-button/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-status-green rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Time + Percentage */}
          <div className="flex items-center justify-between mt-1">
            <OnestFont
              weight={300}
              lineHeight="relaxed"
              className="text-text-grey text-xs italic"
            >
              only {estimatedMinutesRemaining} minutes to go
            </OnestFont>
            <OnestFont
              weight={700}
              lineHeight="relaxed"
              className="text-text-blue-black text-sm"
            >
              {progressPercentage}%
            </OnestFont>
          </div>
        </div>

        {/* Continue Button - wrapped with BetaTooltip */}
        <BetaTooltip position="top" className="w-full">
          <button
            className="w-full bg-elegant-blue text-pure-white py-3.5 rounded-xl hover:opacity-90 transition-opacity cursor-default opacity-80"
          >
            <OnestFont
              weight={700}
              lineHeight="relaxed"
              className="text-sm tracking-widest"
            >
              CONTINUE
            </OnestFont>
          </button>
        </BetaTooltip>
      </div>
    </div>
  );
};

export default HeroModuleCard;