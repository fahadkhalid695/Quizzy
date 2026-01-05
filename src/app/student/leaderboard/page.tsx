'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import BackButton from '@/components/common/BackButton';

interface LeaderboardEntry {
  rank: number;
  studentId: string;
  firstName: string;
  lastName: string;
  averagePercentage: number;
  totalTests: number;
  badge?: string;
}

export default function StudentLeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const notify = useNotify();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    fetchLeaderboard();
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      // Don't require classId - the API will get all classes the student is enrolled in
      const response = await api.get<{ leaderboard: LeaderboardEntry[], message?: string }>('/api/leaderboard');
      setLeaderboard(response.leaderboard || []);
    } catch (error) {
      console.error('Leaderboard error:', error);
      notify.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="min-h-screen bg-slate-900" />;
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankBg = (rank: number) => {
    if (rank === 1) return 'from-yellow-500/30 to-amber-500/30 border-yellow-500/50';
    if (rank === 2) return 'from-gray-400/30 to-slate-400/30 border-gray-400/50';
    if (rank === 3) return 'from-orange-500/30 to-amber-600/30 border-orange-500/50';
    return 'from-white/5 to-white/5 border-white/20';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton href="/student/dashboard" label="Dashboard" />
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">🏆 Leaderboard</h1>
          <p className="text-gray-400 mt-2">See how you rank among your peers</p>
        </div>

        {/* Leaderboard */}
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading leaderboard...</div>
        ) : leaderboard.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-white mb-2">No Rankings Yet</h3>
            <p className="text-gray-400">Complete tests to appear on the leaderboard</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* 2nd Place */}
                <div className="bg-gradient-to-b from-gray-400/20 to-gray-500/10 border border-gray-400/30 rounded-2xl p-6 text-center mt-8">
                  <span className="text-5xl">🥈</span>
                  <h3 className="text-lg font-bold text-white mt-2">
                    {leaderboard[1]?.firstName} {leaderboard[1]?.lastName?.charAt(0)}.
                  </h3>
                  <p className="text-2xl font-bold bg-gradient-to-r from-gray-300 to-gray-400 bg-clip-text text-transparent">
                    {leaderboard[1]?.averagePercentage?.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-400">{leaderboard[1]?.totalTests} tests</p>
                </div>
                
                {/* 1st Place */}
                <div className="bg-gradient-to-b from-yellow-500/20 to-amber-500/10 border border-yellow-500/30 rounded-2xl p-6 text-center">
                  <span className="text-6xl">🥇</span>
                  <h3 className="text-xl font-bold text-white mt-2">
                    {leaderboard[0]?.firstName} {leaderboard[0]?.lastName?.charAt(0)}.
                  </h3>
                  <p className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-amber-400 bg-clip-text text-transparent">
                    {leaderboard[0]?.averagePercentage?.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-400">{leaderboard[0]?.totalTests} tests</p>
                </div>
                
                {/* 3rd Place */}
                <div className="bg-gradient-to-b from-orange-500/20 to-amber-600/10 border border-orange-500/30 rounded-2xl p-6 text-center mt-8">
                  <span className="text-5xl">🥉</span>
                  <h3 className="text-lg font-bold text-white mt-2">
                    {leaderboard[2]?.firstName} {leaderboard[2]?.lastName?.charAt(0)}.
                  </h3>
                  <p className="text-2xl font-bold bg-gradient-to-r from-orange-300 to-amber-400 bg-clip-text text-transparent">
                    {leaderboard[2]?.averagePercentage?.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-400">{leaderboard[2]?.totalTests} tests</p>
                </div>
              </div>
            )}

            {/* Full List */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/20">
                <h3 className="text-lg font-bold text-white">Full Rankings</h3>
              </div>
              <div className="divide-y divide-white/10">
                {leaderboard.map((entry, index) => (
                  <div
                    key={index}
                    className={`p-4 flex items-center justify-between bg-gradient-to-r ${getRankBg(entry.rank)} hover:bg-white/5 transition`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl w-12 text-center">{getRankIcon(entry.rank)}</span>
                      <div>
                        <h4 className="font-bold text-white">
                          {entry.firstName} {entry.lastName}
                        </h4>
                        <p className="text-sm text-gray-400">{entry.totalTests} tests completed</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        {entry.averagePercentage?.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
