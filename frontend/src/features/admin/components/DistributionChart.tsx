import React from 'react';
import { OnestFont } from '../../../assets';

interface DistributionItem {
  label: string;
  value: number;
  bgColor: string;
  textColor: string;
}

interface DistributionChartProps {
  title: string;
  data: DistributionItem[];
}

const DistributionChart: React.FC<DistributionChartProps> = ({ title, data }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-pure-white rounded-xl p-6 shadow-sm">
      <OnestFont weight={500} lineHeight="tight" className="text-text-blue-black text-lg mb-4">
        {title}
      </OnestFont>

      {total === 0 ? (
        <div className="flex items-center justify-center h-32">
          <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-sm">
            No data available
          </OnestFont>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex h-6 rounded-full overflow-hidden bg-light-background-blue">
            {data.map((item, index) => {
              const percentage = total > 0 ? (item.value / total) * 100 : 0;
              if (percentage === 0) return null;
              return (
                <div
                  key={index}
                  className={`${item.bgColor} transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                />
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {data.map((item, index) => {
              const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
              return (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.bgColor} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs truncate">
                        {item.label}
                      </OnestFont>
                      <OnestFont weight={500} lineHeight="relaxed" className="text-text-blue-black text-xs flex-shrink-0">
                        {item.value} ({percentage}%)
                      </OnestFont>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributionChart;