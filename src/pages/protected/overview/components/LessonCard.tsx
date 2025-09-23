import React from "react";
import { RobotoFont } from "../../../../assets";
import { Lesson } from "../types/overview.types";

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

  return (
    <div
      className="bg-[#EFF2FF] rounded-xl flex flex-col lg:flex-row overflow-hidden h-auto"
      style={{ minHeight: "11.25rem" }}
    >
      {/* Left side - Image */}
      <div
        className="w-full lg:w-[276px] h-48 lg:h-full flex-shrink-0 border-[#EFF2FF] lg:border-r-0 rounded-t-xl lg:rounded-l-xl lg:rounded-tr-none"
        style={{ borderWidth: "3px" }}
      >
        <img
          src={lesson.imageUrl}
          alt={lesson.title}
          className="w-full h-full object-cover rounded-t-lg lg:rounded-l-lg lg:rounded-tr-none"
        />
      </div>

      {/* Content container */}
      <div className="flex-1 p-4 lg:p-6 flex flex-col justify-between relative">
        <div className="-mt-2">
          <div className="flex items-start gap-3 mb-2">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#D7DEFF]">
              <RobotoFont
                weight={700}
                className="text-blue-700 text-base lg:text-lg font-bold"
              >
                {lesson.moduleNumber}
              </RobotoFont>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                <div className="min-w-0">
                  <RobotoFont
                    as="h3"
                    weight={500}
                    className="text-gray-900 text-base sm:text-lg font-medium leading-none"
                    style={{
                      wordBreak: "break-word",
                      overflowWrap: "break-word",
                    }}
                  >
                    {lesson.title}
                  </RobotoFont>
                  <RobotoFont weight={400} className="text-gray-600 text-xs">
                    {lesson.duration || `${lesson.lessonsCount} lessons`}
                  </RobotoFont>
                </div>
                {/* Coin display */}
                <div className="flex items-center gap-1 flex-shrink-0 md:-mt-2">
                  <RobotoFont
                    weight={500}
                    className="text-gray-900 text-base lg:text-lg font-bold"
                  >
                    +{lesson.points}
                  </RobotoFont>
                  <img
                    src="src/assets/images/icons/nest-coin.svg"
                    alt="Nest Coin"
                    className="w-5 h-5 lg:w-6 lg:h-6"
                  />
                </div>
              </div>
            </div>
          </div>
          <RobotoFont
            as="p"
            weight={500}
            className="text-gray-600 mb-3 text-sm sm:text-base max-w-[360px] pb-16 md:pb-12 lg:pb-0"
            style={{
              wordBreak: "break-word",
              overflowWrap: "break-word",
            }}
          >
            {lesson.description}
          </RobotoFont>
        </div>

        {/* Bottom section with absolute positioning for precise spacing */}
        <div className="absolute bottom-4 left-4 lg:left-6 right-4 lg:right-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            {showTags && lesson.tags ? (
              <div className="flex flex-wrap items-center gap-2">
                {lesson.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="text-black px-3 py-1.5 rounded-full bg-[#D7DEFF] text-xs sm:text-sm font-medium whitespace-nowrap"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <RobotoFont
                as="p"
                weight={400}
                className="text-gray-500 text-xs sm:text-sm"
                style={{
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {lesson.moduleTitle}
              </RobotoFont>
            )}

            {/* Action Button */}
            <button
              className={`bg-[#3F6CB9] text-white hover:opacity-90 transition-opacity rounded-full w-fit h-11 flex items-center justify-center px-4 lg:px-6 ${
                lesson.status === "locked"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              onClick={() => lesson.status !== "locked" && onAction(lesson.id)}
              disabled={lesson.status === "locked"}
            >
              <RobotoFont weight={500} className="text-sm">
                {getButtonText()}
              </RobotoFont>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonCard;
