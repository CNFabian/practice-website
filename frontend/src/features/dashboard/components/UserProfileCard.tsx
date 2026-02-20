import React from "react";
import { OnestFont, SettingsProfileIcon, GrowthPointsProfileIcon, NotificationProfileIcon, BadgeProfileIcon } from "../../../assets";
import { Icons } from "../images";

interface UserProfileCardProps {
  firstName: string;
  avatarUrl: string | null;
  totalCoins: number;
  currentStreak: number;
  modulesCompleted: number;
  totalModules: number;
  progressPercentage: number;
  notificationCount?: number;
  onNotificationClick?: () => void;
  onSettingsClick?: () => void;
}

const AVATAR_EMOJI_MAP: Record<string, string> = {
  'curious-cat': '🐱',
  'celebrating-bird': '🐦',
  'careful-elephant': '🐘',
  'protective-dog': '🐶',
};

const UserProfileCard: React.FC<UserProfileCardProps> = ({
  firstName,
  avatarUrl,
  totalCoins,
  currentStreak,
  modulesCompleted,
  totalModules,
  notificationCount = 0,
  onNotificationClick,
  onSettingsClick,
}) => {
  const initials = firstName ? firstName[0].toUpperCase() : "U";

  const isAvatarEmoji = avatarUrl?.startsWith('avatar:');
  const avatarEmoji = isAvatarEmoji
    ? AVATAR_EMOJI_MAP[avatarUrl!.replace('avatar:', '')] || '👤'
    : null;

  return (
    <div className="bg-card-gradient rounded-2xl pt-6 px-6 pb-1.5 flex flex-col items-center">
      {/* Large Centered Avatar */}
      <div className="w-24 h-24 rounded-full bg-tab-active flex items-center justify-center flex-shrink-0 overflow-hidden mb-3">
        {isAvatarEmoji ? (
          <span className="text-5xl">{avatarEmoji}</span>
        ) : avatarUrl ? (
          <img
            src={avatarUrl}
            alt={firstName}
            className="w-full h-full object-cover"
          />
        ) : (
          <OnestFont weight={700} lineHeight="relaxed" className="text-logo-blue text-3xl">
            {initials}
          </OnestFont>
        )}
      </div>

      {/* Greeting */}
      <div className="mb-4 text-center">
        <OnestFont as="span" weight={300} lineHeight="relaxed" className="text-text-blue-black text-lg">
          Hello,{" "}
        </OnestFont>
        <OnestFont as="span" weight={700} lineHeight="relaxed" className="text-logo-blue text-lg">
          {firstName}!
        </OnestFont>
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-center gap-5 mb-3 w-full">
        {/* Coins */}
        <div className="flex items-center gap-1.5">
          <img src={Icons.NestCoin} alt="Coins" className="w-8 h-8" />
          <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-sm">
            {totalCoins}
          </OnestFont>
        </div>

        {/* Daily Streak */}
        <div className="flex items-center gap-1.5">
          <img src={GrowthPointsProfileIcon} alt="Streak" className="w-8 h-8 object-contain" />
          <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-sm">
            {currentStreak}
          </OnestFont>
        </div>

        {/* Badges (Modules Completed / Total) */}
        <div className="flex items-center gap-1.5">
          <img src={BadgeProfileIcon} alt="Badges" className="w-8 h-8 object-contain" />
          <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-sm">
            {modulesCompleted}/{totalModules}
          </OnestFont>
        </div>
      </div>

      {/* Divider Line */}
      <div className="w-full h-px bg-unavailable-button/30 mb-1.5" />

      {/* Bell + Chat Icons */}
      <div className="flex items-center justify-center gap-6">
        {/* Notification Bell */}
        <button
          onClick={onNotificationClick}
          className="relative transition-transform duration-200 hover:scale-110"
          aria-label="Notifications"
        >
          <img src={NotificationProfileIcon} alt="Notifications" className="w-12 h-auto" />
          {notificationCount > 0 && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-status-red rounded-full flex items-center justify-center">
              <OnestFont weight={700} lineHeight="relaxed" className="text-pure-white text-xs">
                {notificationCount}
              </OnestFont>
            </div>
          )}
        </button>

        {/* Settings Icon */}
        <button
          onClick={onSettingsClick}
          className="transition-transform duration-200 hover:scale-110"
          aria-label="Profile Settings"
        >
          <img src={SettingsProfileIcon} alt="Settings" className="w-12 h-auto" />
        </button>
      </div>
    </div>
  );
};

export default UserProfileCard;