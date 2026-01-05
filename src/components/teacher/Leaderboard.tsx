'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import Card from '@/components/ui/Card';

interface LeaderboardProps {
  classId: string;
}

interface LeaderboardEntry {
  rank: number;
  badge: string;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  averagePercentage: number;
  totalTests: number;
  obtainedMarks: number;
  totalMarks: number;
}

export default function Leaderboard({ classId }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();
  const hasFetched = useRef(false);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<{ leaderboard: any[] }>(`/api/leaderboard?classId=${classId}`);
      setLeaderboard(response.leaderboard || []);
    } catch (error) {
      notify.error('Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    if (hasFetched.current && classId === hasFetched.current) return;
    hasFetched.current = classId as any;
    fetchLeaderboard();
  }, [classId, fetchLeaderboard]);

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading leaderboard...</div>;
  }

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
      <h3 className="text-xl font-bold text-white mb-6">📊 Class Leaderboard</h3>
      {leaderboard.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No results yet</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Rank</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-300">Student</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-300">Tests</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-300">Score</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-300">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, idx) => {
                const percentColor =
                  entry.averagePercentage >= 80
                    ? 'text-green-400'
                    : entry.averagePercentage >= 60
                    ? 'text-blue-400'
                    : entry.averagePercentage >= 40
                    ? 'text-amber-400'
                    : 'text-red-400';

                return (
                  <tr
                    key={entry.studentId}
                    className={`border-b border-white/10 transition ${
                      idx < 3 ? 'bg-yellow-500/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{entry.badge}</span>
                        <span className="font-bold text-white">#{entry.rank}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">
                        {entry.firstName} {entry.lastName}
                      </div>
                      <div className="text-sm text-gray-400">{entry.email}</div>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-300">{entry.totalTests}</td>
                    <td className="py-3 px-4 text-center font-medium text-white">
                      {entry.obtainedMarks}/{entry.totalMarks}
                    </td>
                    <td className={`py-3 px-4 text-center font-bold text-lg ${percentColor}`}>
                      {entry.averagePercentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
