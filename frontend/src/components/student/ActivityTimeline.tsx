"use client";

import { useState } from "react";
import type { RecentActivity, ActivityType } from "@/types/student";
import { formatRelativeTime } from "@/hooks/useProfile";

interface ActivityTimelineProps {
  activities: RecentActivity[];
  onLoadMore: () => Promise<void>;
}

const TYPE_CONFIG: Record<
  ActivityType,
  { icon: string; bg: string; label: string }
> = {
  QUIZ: { icon: "📝", bg: "bg-blue-500/20", label: "Quiz" },
  TASK: { icon: "✅", bg: "bg-emerald-500/20", label: "Task" },
  POMODORO: { icon: "🍅", bg: "bg-orange-500/20", label: "Pomodoro" },
  BADGE: { icon: "🏆", bg: "bg-yellow-500/20", label: "Huy Hiệu" },
};

const FILTER_OPTIONS: Array<{ key: ActivityType | "ALL"; label: string }> = [
  { key: "ALL", label: "Tất cả" },
  { key: "QUIZ", label: "Quiz" },
  { key: "TASK", label: "Task" },
  { key: "POMODORO", label: "Pomodoro" },
  { key: "BADGE", label: "Huy Hiệu" },
];

export default function ActivityTimeline({
  activities,
  onLoadMore,
}: ActivityTimelineProps) {
  const [filter, setFilter] = useState<ActivityType | "ALL">("ALL");
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const filtered =
    filter === "ALL"
      ? activities
      : activities.filter((a) => a.type === filter);

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    await onLoadMore();
    setIsLoadingMore(false);
  };

  return (
    <div className="space-y-6">
      {/* Filter Pills */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
              filter === key
                ? "bg-emerald-500 text-white"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-700" />

        <div className="space-y-4 pl-14">
          {filtered.length === 0 ? (
            <p className="text-slate-500 text-sm py-8 text-center">
              Không có hoạt động nào.
            </p>
          ) : (
            filtered.map((activity, idx) => {
              const cfg = TYPE_CONFIG[activity.type];
              return (
                <div
                  key={activity.id}
                  className="relative animate-fade-in"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {/* Dot on timeline */}
                  <div
                    className={`absolute -left-9 top-3.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm ${cfg.bg}`}
                  >
                    {cfg.icon}
                  </div>

                  {/* Card */}
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 hover:border-slate-600 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white text-sm leading-snug">
                          {activity.description}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {activity.detail}
                        </p>
                      </div>
                      <span className="text-xs text-slate-500 flex-shrink-0 mt-0.5">
                        {formatRelativeTime(activity.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Load More */}
      {filtered.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                Đang tải...
              </>
            ) : (
              "Xem thêm hoạt động"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
