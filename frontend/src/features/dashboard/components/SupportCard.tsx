import React from "react";
import { OnestFont } from "../../../assets";
import { SupportCard as SupportCardType } from "../types/overview.types";

interface SupportCardProps {
  supportCard: SupportCardType;
}

const SupportCard: React.FC<SupportCardProps> = ({ supportCard }) => {
  return (
    <div 
      className="flex items-center px-3 sm:px-4 py-3 sm:py-0 min-h-[4rem] sm:h-16 bg-tab-active rounded-xl hover:bg-tab-active/80 transition-colors cursor-pointer"
      onClick={supportCard.action}
    >
      <div className="flex items-center gap-3 sm:gap-4 w-full">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0">
          <img
            src={supportCard.icon}
            alt={supportCard.title}
            className="w-8 h-8 sm:w-10 sm:h-10"
          />
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <OnestFont 
            as="h3" 
            weight={700} 
            lineHeight="relaxed"
            className="text-text-blue-black text-base sm:text-lg font-semibold leading-tight"
            style={{ 
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {supportCard.title}
          </OnestFont>
          <OnestFont 
            as="p" 
            weight={300} 
            lineHeight="relaxed"
            className="text-text-grey text-xs sm:text-sm leading-tight mt-0.5"
            style={{ 
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}
          >
            {supportCard.subtitle}
          </OnestFont>
        </div>
      </div>
    </div>
  );
};

export default SupportCard;