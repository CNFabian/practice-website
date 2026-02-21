import React from 'react';
import { OnestFont } from '../../../assets';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: string;
  iconBgColor: string;
  subtitle?: string;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  icon,
  iconBgColor,
  subtitle,
}) => {
  return (
    <div className="bg-pure-white rounded-xl p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
            {title}
          </OnestFont>
          <OnestFont weight={700} lineHeight="tight" className="text-text-blue-black text-3xl mt-2">
            {value}
          </OnestFont>
          {subtitle && (
            <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs mt-1">
              {subtitle}
            </OnestFont>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${iconBgColor}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default KPICard;