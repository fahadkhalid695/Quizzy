'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/api/leaderboard?classId=${classId}`);
        setLeaderboard(response.leaderboard || []);
      } catch (error) {
        notify.error('Failed to fetch leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [classId, notify]);

  if (loading) {
    return <div className="text-center py-8">Loading leaderboard...</div>;
  }

  return (
    <Card>
      <Card.Header title="📊 Class Leaderboard" />
      <Card.Body>
        {leaderboard.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No results yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Student</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Tests</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Score</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => {
                  const percentColor =
                    entry.averagePercentage >= 80
                      ? 'text-green-600'
                      : entry.averagePercentage >= 60
                      ? 'text-blue-600'
                      : entry.averagePercentage >= 40
                      ? 'text-amber-600'
                      : 'text-red-600';

                  return (
                    <tr
                      key={entry.studentId}
                      className={`border-b border-gray-100 transition ${
                        idx < 3 ? 'bg-yellow-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{entry.badge}</span>
                          <span className="font-bold text-gray-900">#{entry.rank}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {entry.firstName} {entry.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{entry.email}</div>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-700">{entry.totalTests}</td>
                      <td className="py-3 px-4 text-center font-medium text-gray-900">
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
      </Card.Body>
    </Card>
  );
}
