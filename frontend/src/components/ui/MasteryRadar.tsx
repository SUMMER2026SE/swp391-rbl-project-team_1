'use client';

import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer
} from 'recharts';

interface MasteryRadarProps {
  masteries: {
    skillName: string;
    level: number;
  }[];
}

export function MasteryRadar({ masteries }: MasteryRadarProps) {
  // If empty, return fallback message
  if (masteries.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-500 text-sm font-semibold">
        Chưa có thông tin kỹ năng để hiển thị.
      </div>
    );
  }

  // Map masteries for Recharts
  const data = masteries.map((m) => ({
    subject: m.skillName,
    A: Math.round(m.level * 100),
    fullMark: 100
  }));

  return (
    <div className="w-full h-64 select-none">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fill: '#475569', fontSize: 8 }}
            stroke="#1e293b"
          />
          <Radar
            name="Thành thạo"
            dataKey="A"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.25}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MasteryRadar;
