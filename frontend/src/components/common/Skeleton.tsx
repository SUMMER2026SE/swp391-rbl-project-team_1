import React from 'react';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`animate-pulse bg-slate-800 rounded-xl ${className}`} />
  );
}

export function RoadmapSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="w-full h-32 rounded-3xl" />
      <div className="space-y-4 relative pl-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex gap-4 items-start">
            <Skeleton className="w-8 h-8 rounded-full shrink-0" />
            <Skeleton className="w-full h-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BadgeListSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
        <Skeleton key={i} className="w-full h-36" />
      ))}
    </div>
  );
}

export function CommunityListSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Skeleton key={i} className="w-full h-64 rounded-3xl" />
      ))}
    </div>
  );
}
