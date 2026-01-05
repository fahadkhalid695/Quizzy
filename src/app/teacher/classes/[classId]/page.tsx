'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import TestFormAI from '@/components/teacher/TestFormAI';
import Leaderboard from '@/components/teacher/Leaderboard';
import Button from '@/components/ui/Button';
import BackButton from '@/components/common/BackButton';

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface SearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Invitation {
  _id: string;
  studentName: string;
  studentEmail: string;
  status: string;
  createdAt: string;
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.classId as string;
  const [classData, setClassData] = useState<any>(null);
  const [tests, setTests] = useState<any[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTestForm, setShowTestForm] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [activeTab, setActiveTab] = useState<'tests' | 'students' | 'leaderboard'>('tests');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    if (!classId) return;
    fetchClassData();
    fetchTests();
  }, [classId]);

  useEffect(() => {
    if (activeTab === 'students') {
      fetchStudents();
      fetchInvitations();
    }
  }, [activeTab, classId]);

  const fetchClassData = async () => {
    try {
      const response = await api.get<{ class: any }>(`/api/classes/${classId}`);
      setClassData(response.class);
    } catch (error) {
      notify.error('Failed to load class');
    }
  };

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ tests: any[] }>(`/api/tests/list?classId=${classId}&showAll=true`);
      setTests(response.tests || []);
    } catch (error) {
      notify.error('Failed to load tests');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get<{ students: Student[] }>(`/api/classes/students?classId=${classId}`);
      setStudents(response.students || []);
    } catch (error) {
      console.error('Failed to load students:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await api.get<{ invitations: Invitation[] }>(`/api/invitations/teacher?classId=${classId}`);
      setInvitations(response.invitations || []);
    } catch (error) {
      console.error('Failed to load invitations:', error);
    }
  };

  const handleSearchStudents = async () => {
    if (searchEmail.length < 3) {
      notify.error('Please enter at least 3 characters');
      return;
    }
    try {
      setSearchLoading(true);
      const response = await api.get<{ users: SearchResult[] }>(`/api/users/search?email=${encodeURIComponent(searchEmail)}&role=student`);
      setSearchResults(response.users || []);
      if (response.users.length === 0) {
        notify.info('No students found with this email');
      }
    } catch (error) {
      notify.error('Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendInvitation = async (studentEmail: string) => {
    try {
      setSendingInvite(true);
      await api.post('/api/invitations/teacher', {
        classId,
        studentEmail,
        message: inviteMessage,
      });
      notify.success('Invitation sent successfully!');
      setSearchEmail('');
      setSearchResults([]);
      setInviteMessage('');
      setShowAddStudent(false);
      fetchInvitations();
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to send invitation');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!confirm('Are you sure you want to remove this student from the class?')) return;
    try {
      await api.delete(`/api/classes/students?classId=${classId}&studentId=${studentId}`);
      notify.success('Student removed from class');
      fetchStudents();
    } catch (error) {
      notify.error('Failed to remove student');
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await api.delete(`/api/invitations/teacher?id=${invitationId}`);
      notify.success('Invitation cancelled');
      fetchInvitations();
    } catch (error) {
      notify.error('Failed to cancel invitation');
    }
  };

  const handlePublishTest = async (testId: string, publish: boolean) => {
    try {
      await api.put(`/api/tests/${testId}`, { isPublished: publish });
      notify.success(publish ? 'Test published! Students can now see it.' : 'Test unpublished');
      fetchTests();
    } catch (error) {
      notify.error('Failed to update test');
    }
  };

  const handleDeleteTest = async (testId: string) => {
    if (!confirm('Are you sure you want to delete this test? This cannot be undone.')) return;
    try {
      await api.delete(`/api/tests/${testId}`);
      notify.success('Test deleted');
      fetchTests();
    } catch (error) {
      notify.error('Failed to delete test');
    }
  };

  if (!classId) {
    return <div className="min-h-screen bg-slate-900 text-center py-12 text-gray-400">Class not found</div>;
  }

  const pendingInvitations = invitations.filter(function(i) { return i.status === 'pending'; });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <BackButton href="/teacher/classes" label="Classes" />
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">
              📖 {classData?.name || 'Class'}
            </h1>
            {classData?.description && (
              <p className="text-gray-400 mt-2">{classData.description}</p>
            )}
            {classData?.code && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-gray-500 text-sm">Class Code:</span>
                <code className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-purple-300 font-mono text-lg">
                  {classData.code}
                </code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(classData.code);
                    notify.success('Class code copied!');
                  }}
                  className="p-1 hover:bg-white/10 rounded transition"
                  title="Copy code"
                >
                  📋
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-400">
            <span>👥 {students.length} students</span>
            <span>•</span>
            <span>📝 {tests.length} tests</span>
          </div>
        </div>

        {/* Tabs - Mobile Responsive */}
        <div className="flex gap-1 md:gap-2 border-b border-white/20 overflow-x-auto">
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3 md:px-4 py-2 md:py-3 font-semibold border-b-2 transition whitespace-nowrap text-sm md:text-base ${
              activeTab === 'tests'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            📝 Tests ({tests.length})
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3 md:px-4 py-2 md:py-3 font-semibold border-b-2 transition flex items-center gap-1 md:gap-2 whitespace-nowrap text-sm md:text-base ${
              activeTab === 'students'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            👥 Students ({students.length})
            {pendingInvitations.length > 0 && (
              <span className="px-1.5 md:px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded-full">
                {pendingInvitations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-3 md:px-4 py-2 md:py-3 font-semibold border-b-2 transition whitespace-nowrap text-sm md:text-base ${
              activeTab === 'leaderboard'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            🏆 Leaderboard
          </button>
        </div>

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <div className="space-y-6">
            {!showTestForm && (
              <Button
                variant="primary"
                onClick={() => setShowTestForm(true)}
                className="w-full md:w-auto"
              >
                + Create Test with AI
              </Button>
            )}

            {showTestForm && (
              <TestFormAI
                classId={classId}
                onSuccess={() => {
                  setShowTestForm(false);
                  fetchTests();
                }}
                onCancel={() => setShowTestForm(false)}
              />
            )}

            {!showTestForm && loading ? (
              <div className="text-center py-8 text-gray-400">Loading tests...</div>
            ) : !showTestForm && tests.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 md:p-12 text-center">
                <div className="text-4xl mb-4">📝</div>
                <p className="text-gray-400">No tests yet. Create your first test!</p>
              </div>
            ) : !showTestForm && (
              <div className="grid gap-4">
                {tests.map((test) => (
                  <div 
                    key={test.id} 
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 md:p-6 hover:bg-white/15 hover:border-purple-400/50 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base md:text-lg font-bold text-white">{test.title}</h3>
                          {test.aiGenerated && (
                            <span className="px-2 py-0.5 text-xs bg-purple-500/20 text-purple-300 rounded-full">
                              🤖 AI
                            </span>
                          )}
                          {test.isDynamic && (
                            <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded-full">
                              🔀 Dynamic
                            </span>
                          )}
                        </div>
                        {test.description && (
                          <p className="text-gray-400 text-sm mt-1 line-clamp-2">{test.description}</p>
                        )}
                        <div className="flex flex-wrap gap-2 md:gap-3 mt-3 text-xs md:text-sm">
                          <span className="text-gray-400">
                            📝 {test.questionCount}
                          </span>
                          <span className="text-gray-400">⏱️ {test.duration}m</span>
                          <span className="text-gray-400">⭐ {test.difficulty}</span>
                          <span
                            className={`font-medium ${
                              test.isPublished ? 'text-green-400' : 'text-amber-400'
                            }`}
                          >
                            {test.isPublished ? '✓ Published' : 'Draft'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 self-end sm:self-start">
                        <Button 
                          variant={test.isPublished ? 'secondary' : 'success'}
                          size="sm"
                          onClick={() => handlePublishTest(test.id, !test.isPublished)}
                        >
                          {test.isPublished ? 'Unpublish' : 'Publish'}
                        </Button>
                        <Button 
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteTest(test.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="text-lg md:text-xl font-bold text-white">Class Students</h2>
              <Button variant="primary" onClick={() => setShowAddStudent(true)}>
                + Add Student
              </Button>
            </div>

            {/* Pending Invitations */}
            {pendingInvitations.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 md:p-4">
                <h3 className="text-yellow-400 font-semibold mb-3 flex items-center gap-2 text-sm md:text-base">
                  ⏳ Pending Invitations ({pendingInvitations.length})
                </h3>
                <div className="space-y-2">
                  {pendingInvitations.map((inv) => (
                    <div key={inv._id} className="flex items-center justify-between bg-white/5 rounded-lg p-2 md:p-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-white font-medium text-sm md:text-base truncate">{inv.studentName}</p>
                        <p className="text-gray-400 text-xs md:text-sm truncate">{inv.studentEmail}</p>
                      </div>
                      <button
                        onClick={() => handleCancelInvitation(inv._id)}
                        className="text-red-400 hover:text-red-300 text-xs md:text-sm ml-2 whitespace-nowrap"
                      >
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Student List */}
            {students.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 md:p-12 text-center">
                <div className="text-4xl mb-4">👥</div>
                <p className="text-gray-400 mb-4">No students in this class yet.</p>
                <p className="text-gray-500 text-sm">
                  Share the class code <code className="text-purple-400">{classData?.code}</code> or send invitations.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile view - cards */}
                <div className="block md:hidden space-y-3">
                  {students.map((student) => (
                    <div key={student.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                            {student.firstName[0]}{student.lastName[0]}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-white font-medium text-sm truncate">
                              {student.firstName} {student.lastName}
                            </p>
                            <p className="text-gray-400 text-xs truncate">{student.email}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveStudent(student.id)}
                          className="text-red-400 hover:text-red-300 text-xs ml-2"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop view - table */}
                <div className="hidden md:block bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left p-4 text-gray-400 font-medium">Student</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Email</th>
                        <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student.id} className="border-b border-white/5 hover:bg-white/5">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                {student.firstName[0]}{student.lastName[0]}
                              </div>
                              <span className="text-white font-medium">
                                {student.firstName} {student.lastName}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-400">{student.email}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleRemoveStudent(student.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && <Leaderboard classId={classId} />}

        {/* Add Student Modal */}
        {showAddStudent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg animate-scale-in">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">Add Student to Class</h3>
                <button
                  onClick={() => {
                    setShowAddStudent(false);
                    setSearchEmail('');
                    setSearchResults([]);
                    setInviteMessage('');
                  }}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Search */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Search by Email
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={searchEmail}
                      onChange={(e) => setSearchEmail(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchStudents()}
                      placeholder="student@email.com"
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                    />
                    <Button
                      variant="secondary"
                      onClick={handleSearchStudents}
                      isLoading={searchLoading}
                    >
                      Search
                    </Button>
                  </div>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">
                      Found Students
                    </label>
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                            {result.firstName[0]}{result.lastName[0]}
                          </div>
                          <div>
                            <p className="text-white font-medium">{result.firstName} {result.lastName}</p>
                            <p className="text-gray-400 text-sm">{result.email}</p>
                          </div>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSendInvitation(result.email)}
                          isLoading={sendingInvite}
                        >
                          Send Invite
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Invitation Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Invitation Message (optional)
                  </label>
                  <textarea
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    placeholder="Welcome to the class! Looking forward to learning together."
                    rows={3}
                    className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                {/* Tips */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-sm">
                  <p className="text-blue-300 font-medium mb-2">💡 Other ways to add students:</p>
                  <ul className="text-blue-200/70 space-y-1">
                    <li>• Share the class code: <code className="text-blue-300">{classData?.code}</code></li>
                    <li>• Students can join using the code from their dashboard</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
