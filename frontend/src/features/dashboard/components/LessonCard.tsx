import React, { useState, useEffect } from "react";
import { OnestFont } from "../../../assets";
import { Lesson } from "../types/overview.types";
import { Icons } from '../images';  // ✅ Import Icons

interface LessonCardProps {
  lesson: Lesson;
  onAction: (lessonId: string) => void;
  showTags?: boolean;
}

const LessonCard: React.FC<LessonCardProps> = ({
  lesson,
  onAction,
  showTags = false,
}) => {
  const [screenWidth, setScreenWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getButtonText = () => {
    switch (lesson.status) {
      case "continue":
        return "Continue";
      case "start":
        return "Start";
      case "locked":
        return "Locked";
      default:
        return "Start";
    }
  };

  const getTruncatedDescription = (text: string) => {
    if (screenWidth < 640) {
      return text.length > 60 ? text.substring(0, 60) + "..." : text;
    } else if (screenWidth < 1024) {
      return text.length > 100 ? text.substring(0, 100) + "..." : text;
    } else {
      return text.length > 140 ? text.substring(0, 140) + "..." : text;
    }
  };

  return (
    <div
      className="bg-card-gradient rounded-xl flex flex-col 2xl:flex-row overflow-hidden h-auto"
      style={{ minHeight: "11.25rem" }}
    >
      {/* Left side - Image */}
      <div
        className="w-full 2xl:w-[276px] h-48 2xl:h-full flex-shrink-0 border-card-gradient 2xl:border-r-0 rounded-t-xl 2xl:rounded-l-xl 2xl:rounded-tr-none"
        style={{ borderWidth: "3px" }}
      >
        <img
          src={lesson.imageUrl}
          alt={lesson.title}
          className="w-full h-full object-cover rounded-t-lg 2xl:rounded-l-lg 2xl:rounded-tr-none"
        />
      </div>

      {/* Content container */}
      <div className="flex-1 p-4 2xl:p-6 flex flex-col justify-between relative min-w-0">
        <div className="-mt-2">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-8 h-8 2xl:w-10 2xl:h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-tab-active">
              <OnestFont
                weight={700}
                lineHeight="relaxed"
                className="text-logo-blue text-base 2xl:text-lg font-bold"
              >
                {lesson.moduleNumber}
              </OnestFont>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                <div className="min-w-0">
                  <OnestFont
                    as="h3"
                    weight={700}
                    lineHeight="relaxed"
                    className="text-text-blue-black text-base sm:text-lg font-medium leading-tight"
                    style={{
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    {lesson.title}
                  </OnestFont>
                  <OnestFont weight={300} lineHeight="relaxed" className="text-text-grey text-xs">
                    {lesson.duration || `${lesson.lessonsCount} lessons`}
                  </OnestFont>
                </div>
                {/* Coin display */}
                <div className="flex items-center gap-1 flex-shrink-0 md:-mt-2">
                  <OnestFont
                    weight={500}
                    lineHeight="relaxed"
                    className="text-text-blue-black text-base 2xl:text-lg font-bold"
                  >
                    +{lesson.points}
                  </OnestFont>
                  <img
                    src={Icons.NestCoin} 
                    alt="Nest Coin"
                    className="w-5 h-5 2xl:w-6 2xl:h-6"
                  />
                </div>
              </div>
            </div>
          </div>
          <OnestFont
            as="p"
            weight={300}
            lineHeight="relaxed"
            className="text-text-grey mb-3 text-sm sm:text-base max-w-[360px] pb-16 md:pb-12 2xl:pb-0"
            style={{
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {getTruncatedDescription(lesson.description)}
          </OnestFont>
        </div>

        {/* Bottom section with absolute positioning for precise spacing */}
        <div className="absolute bottom-4 left-4 2xl:left-6 right-4 2xl:right-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            {showTags && lesson.tags ? (
              <div className="flex flex-wrap items-center gap-2">
                {lesson.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-black px-3 py-1.5 rounded-full bg-tab-active text-xs sm:text-sm font-medium whitespace-nowrap"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <OnestFont
                as="p"
                weight={300}
                lineHeight="relaxed"
                className="text-unavailable-button text-xs sm:text-sm"
                style={{
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {lesson.moduleTitle}
              </OnestFont>
            )}

            {/* Action Button */}
            <button
              className={`bg-logo-blue text-white hover:opacity-90 transition-opacity rounded-full w-fit h-11 flex items-center justify-center px-4 2xl:px-6 ${
                lesson.status === "locked"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={() => lesson.status !== "locked" && onAction(lesson.id)}
              disabled={lesson.status === "locked"}
            >
              <OnestFont weight={500} lineHeight="relaxed" className="text-sm">
                {getButtonText()}
              </OnestFont>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonCard;