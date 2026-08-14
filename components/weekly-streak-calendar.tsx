"use client";

import Image from "next/image";
import { Zap } from "lucide-react";

export type WeeklyStreakDay = {
  dateKey: string;
  dayLabel: string;
  active: boolean;
};

interface WeeklyStreakCalendarProps {
  weeklyStreakDays: WeeklyStreakDay[];
  size?: "sm" | "md";
  showStatusText?: boolean;
}

export function WeeklyStreakCalendar({
  weeklyStreakDays,
  size = "md",
  showStatusText = false,
}: WeeklyStreakCalendarProps) {
  const isSm = size === "sm";

  return (
    <div className={isSm ? "mt-6 grid grid-cols-7 gap-2" : "mt-8 grid grid-cols-7 gap-2 sm:gap-3"}>
      {weeklyStreakDays.map((day) => {
        const completed = day.active;

        return (
          <div key={day.dateKey} className="flex flex-col items-center gap-2">
            <div
              className={
                completed
                  ? isSm
                    ? "flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft shadow-[0_8px_20px_-16px_rgba(60,199,79,0.45)]"
                    : "flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft shadow-[0_12px_28px_-20px_rgba(60,199,79,0.45)]"
                  : isSm
                  ? "flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f4f7]"
                  : "flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f4f7]"
              }
            >
              {completed ? (
                <Image
                  src="/streak.png"
                  alt={`${day.dayLabel} streak complete`}
                  width={isSm ? 18 : 22}
                  height={isSm ? 18 : 22}
                  className="object-contain"
                  style={{
                    width: isSm ? "18px" : "22px",
                    height: isSm ? "18px" : "22px",
                  }}
                />
              ) : (
                <Zap className={isSm ? "h-4 w-4 text-[#b8bfce]" : "h-5 w-5 text-[#b8bfce]"} />
              )}
            </div>
            <div className="text-center">
              <p className={isSm ? "text-xs font-medium text-[#697391]" : "text-sm font-medium text-[#505a78]"}>
                {day.dayLabel}
              </p>
              {showStatusText && (
                <p className="mt-1 text-xs text-[#8a92ac]">
                  {completed ? "Active" : "Idle"}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
