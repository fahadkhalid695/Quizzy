'use client';

import { useEffect, useState } from 'react';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Input } from '@/components/ui/FormElements';

interface Prize {
  rank: number;
  name: string;
  description: string;
  reward: string;
}

interface PrizeProps {
  classId: string;
}

export default function PrizeAnnouncer({ classId }: PrizeProps) {
  const [prizes, setPrizes] = useState<Prize[]>([
    { rank: 1, name: '🥇 1st Place', description: 'Top Performer', reward: '100 bonus points' },
    { rank: 2, name: '🥈 2nd Place', description: 'Great Effort', reward: '75 bonus points' },
    { rank: 3, name: '🥉 3rd Place', description: 'Good Job', reward: '50 bonus points' },
  ]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPrize, setEditingPrize] = useState<number | null>(null);
  const [newReward, setNewReward] = useState('');
  const notify = useNotify();

  useEffect(() => {
    fetchLeaderboard();
  }, [classId]);

  const fetchLeaderboard = async () => {
    try {
      const response = await api.get<{ leaderboard: any }>(`/api/leaderboard?classId=${classId}`);
      setLeaderboard(response.leaderboard);
    } catch (error) {
      notify.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReward = (rank: number, newReward: string) => {
    setPrizes(prizes.map((p) => (p.rank === rank ? { ...p, reward: newReward } : p)));
    setEditingPrize(null);
    notify.success('Prize updated!');
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Prize Configuration */}
      <Card>
        <Card.Header title="🎁 Configure Prizes" />
        <Card.Body>
          <div className="space-y-3">
            {prizes.map((prize) => (
              <div key={prize.rank} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex-1">
                  <div className="font-bold text-white">{prize.name}</div>
                  <div className="text-sm text-gray-400">{prize.description}</div>
                  {editingPrize === prize.rank ? (
                    <div className="mt-2 flex gap-2">
                      <Input
                        value={newReward}
                        onChange={(e) => setNewReward(e.target.value)}
                        placeholder="e.g., 100 bonus points"
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateReward(prize.rank, newReward)}
                      >
                        Save
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setEditingPrize(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2 text-sm font-medium text-purple-400">{prize.reward}</div>
                  )}
                </div>
                {editingPrize !== prize.rank && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setEditingPrize(prize.rank);
                      setNewReward(prize.reward);
                    }}
                  >
                    Edit
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Winners Announcement */}
      <Card>
        <Card.Header title="🏆 Today's Winners" />
        <Card.Body>
          {leaderboard.length === 0 ? (
            <p className="text-center text-gray-400">No students yet</p>
          ) : (
            <div className="space-y-3">
              {leaderboard.slice(0, 3).map((student, idx) => {
                const prize = prizes.find((p) => p.rank === student.rank);
                return (
                  <div
                    key={student.studentId}
                    className={`p-4 rounded-lg border-2 ${
                      idx === 0
                        ? 'border-yellow-500/50 bg-yellow-500/10'
                        : idx === 1
                        ? 'border-gray-400/50 bg-gray-500/10'
                        : 'border-orange-500/50 bg-orange-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-4xl">{student.badge}</span>
                          <div>
                            <div className="font-bold text-white">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-400">{student.email}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-sm">
                          <span className="font-semibold text-gray-900">Score: {student.averagePercentage}%</span>
                          <span className="ml-4 text-gray-600">
                            {student.obtainedMarks}/{student.totalMarks}
                          </span>
                        </div>
                      </div>
                      {prize && (
                        <div className="text-right">
                          <div className="font-bold text-indigo-600 text-lg">{prize.reward}</div>
                          <div className="text-xs text-gray-500 mt-1">{prize.description}</div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Winner Announcement */}
      {leaderboard.length > 0 && (
        <Card>
          <Card.Header title="📢 Announcement" />
          <Card.Body>
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border-2 border-indigo-200 text-center space-y-2">
              <div className="text-4xl">🎉</div>
              <div className="text-2xl font-bold text-gray-900">
                Congratulations {leaderboard[0]?.firstName}!
              </div>
              <div className="text-lg text-gray-700">
                You achieved the highest score in the class: <span className="font-bold">{leaderboard[0]?.averagePercentage}%</span>
              </div>
              <div className="text-indigo-600 font-bold text-xl">
                🎁 {prizes[0]?.reward}
              </div>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
