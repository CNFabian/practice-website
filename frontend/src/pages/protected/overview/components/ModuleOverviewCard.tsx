import React from "react";
import { OnestFont } from "../../../../assets";
import { Icons } from "../images";

interface ModuleOverviewCardProps {
  orderNumber: number;
  title: string;
  coinReward: number;
  durationMinutes: number;
  description: string;
  progressPercentage: number;
  tags: string[];
  thumbnailUrl: string;
  status: "completed" | "in-progress" | "not-started" | "locked";
  onAction: () => void;
}

const ModuleOverviewCard: React.FC<ModuleOverviewCardProps> = ({
  orderNumber,
  title,
  coinReward,
  durationMinutes,
  description,
  progressPercentage,
  tags,
  thumbnailUrl,
  status,
  onAction,
}) => {
  const getButtonText = () => {
    switch (status) {
      case "completed":
        return "Review";
      case "in-progress":
        return "Continue";
      case "not-started":
        return "Start";
      case "locked":
        return "Locked";
      default:
        return "Start";
    }
  };

  const getButtonStyles = () => {
    switch (status) {
      case "completed":
        return "bg-status-green text-pure-white hover:opacity-90";
      case "in-progress":
        return "bg-logo-blue text-pure-white hover:opacity-90";
      case "not-started":
        return "bg-logo-blue text-pure-white hover:opacity-90";
      case "locked":
        return "bg-unavailable-button text-text-grey cursor-not-allowed";
      default:
        return "bg-logo-blue text-pure-white hover:opacity-90";
    }
  };

  const getStatusRibbon = () => {
    if (status === "completed") {
      return (
        <div className="absolute top-3 right-3 bg-status-green text-pure-white px-2.5 py-1 rounded-md text-xs z-10">
          <OnestFont weight={700} lineHeight="relaxed">
            FINISHED
          </OnestFont>
        </div>
      );
    }
    if (status === "in-progress") {
      return (
        <div className="absolute top-3 right-3 bg-logo-blue text-pure-white px-2.5 py-1 rounded-md text-xs z-10">
          <OnestFont weight={700} lineHeight="relaxed">
            IN PROGRESS
          </OnestFont>
        </div>
      );
    }
    return null;
  };

  const getAccentColor = () => {
    switch (status) {
      case "completed":
        return "bg-status-green";
      case "in-progress":
        return "bg-logo-blue";
      case "not-started":
        return "bg-elegant-blue";
      case "locked":
        return "bg-unavailable-button";
      default:
        return "bg-elegant-blue";
    }
  };

  const getProgressBarColor = () => {
    switch (status) {
      case "completed":
        return "bg-status-green";
      case "in-progress":
        return "bg-logo-blue";
      default:
        return "bg-unavailable-button";
    }
  };

  return (
    <div className="bg-card-gradient rounded-xl overflow-hidden flex flex-col md:flex-row">
      {/* Left Accent Bar */}
      <div className={`w-full h-1 md:w-1.5 md:h-auto flex-shrink-0 ${getAccentColor()}`} />

      {/* Content Section */}
      <div className="flex-1 p-4 lg:p-5 flex flex-col justify-between min-w-0">
        {/* Top Row: Number + Title + Coins + Duration */}
        <div className="flex items-start gap-3 mb-2">
          {/* Order Number Circle */}
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-tab-active">
            <OnestFont weight={700} lineHeight="relaxed" className="text-logo-blue text-sm">
              {orderNumber}
            </OnestFont>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
              <OnestFont
                as="h3"
                weight={700}
                lineHeight="tight"
                className="text-text-blue-black text-base"
                style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
              >
                {title}
              </OnestFont>

              {/* Coins + Duration */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <img src={Icons.NestCoin} alt="Coin" className="w-4 h-4" />
                  <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-xs">
                    +{coinReward}
                  </OnestFont>
                </div>
                <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
                  {durationMinutes} min
                </OnestFont>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <OnestFont
          as="p"
          weight={300}
          lineHeight="relaxed"
          className="text-text-grey text-sm mb-3 ml-12 max-w-[400px]"
          style={{ wordBreak: "break-word", overflowWrap: "break-word" }}
        >
          {description.length > 120 ? description.substring(0, 120) + "..." : description}
        </OnestFont>

        {/* Progress Bar */}
        <div className="ml-12 mb-3">
          <div className="h-2 bg-unavailable-button/20 rounded-full overflow-hidden max-w-[300px]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressBarColor()}`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Bottom Row: Tags + Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ml-12">
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="bg-tab-active text-text-blue-black px-3 py-1 rounded-full text-xs"
              >
                <OnestFont weight={500} lineHeight="relaxed">
                  {tag}
                </OnestFont>
              </span>
            ))}
          </div>

          <button
            className={`rounded-full px-5 py-2 transition-opacity flex-shrink-0 ${getButtonStyles()}`}
            onClick={onAction}
            disabled={status === "locked"}
          >
            <OnestFont weight={500} lineHeight="relaxed" className="text-sm">
              {getButtonText()}
            </OnestFont>
          </button>
        </div>
      </div>

      {/* Right Thumbnail */}
      <div className="relative w-full md:w-[180px] lg:w-[200px] h-40 md:h-auto flex-shrink-0">
        {getStatusRibbon()}
        <img
          src={thumbnailUrl}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
};

export default ModuleOverviewCard;