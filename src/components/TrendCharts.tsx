"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  Bar,
  BarChart,
} from "recharts";

export interface TrendPoint {
  date: string;
  sleepHours: number | null;
  overallRPE: number | null;
  studyFocusScore: number | null;
  energyAvg: number | null;
}

export interface RegionPoint {
  label: string;
  completionRate: number;
}

export function TrendLineChart({ data }: { data: TrendPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="sleepHours" name="수면(h)" stroke="#2563eb" strokeWidth={2} connectNulls />
        <Line type="monotone" dataKey="overallRPE" name="RPE" stroke="#dc2626" strokeWidth={2} connectNulls />
        <Line type="monotone" dataKey="studyFocusScore" name="집중도" stroke="#16a34a" strokeWidth={2} connectNulls />
        <Line type="monotone" dataKey="energyAvg" name="에너지" stroke="#d97706" strokeWidth={2} connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RegionBarChart({ data }: { data: RegionPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
        <Tooltip />
        <Bar dataKey="completionRate" name="완수율" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
