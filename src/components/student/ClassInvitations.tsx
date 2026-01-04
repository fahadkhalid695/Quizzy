'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import { useNotify } from '@/components/common/Notification'

interface Invitation {
  _id: string
  classId: string
  className: string
  teacherName: string
  message?: string
  status: string
  expiresAt: string
  createdAt: string
}

interface ClassInvitationsProps {
  onClassJoined?: () => void
}

export default function ClassInvitations({ onClassJoined }: ClassInvitationsProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [classCode, setClassCode] = useState('')
  const [joinLoading, setJoinLoading] = useState(false)
  const notify = useNotify()

  useEffect(() => {
    fetchInvitations()
  }, [])

  const fetchInvitations = async () => {
    try {
      setLoading(true)
      const response = await api.get<{ invitations: Invitation[] }>('/api/invitations/student?status=pending')
      setInvitations(response.invitations || [])
    } catch (error) {
      console.error('Failed to fetch invitations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResponse = async (invitationId: string, action: 'accept' | 'decline') => {
    try {
      setActionLoading(invitationId)
      await api.post('/api/invitations/student', { invitationId, action })
      notify.success(action === 'accept' ? 'You have joined the class!' : 'Invitation declined')
      fetchInvitations()
      if (action === 'accept' && onClassJoined) {
        onClassJoined()
      }
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to respond to invitation')
    } finally {
      setActionLoading(null)
    }
  }

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classCode.trim()) return

    try {
      setJoinLoading(true)
      const response = await api.post<{ success: boolean; message: string; class: any }>('/api/classes/join', { code: classCode.trim().toUpperCase() })
      notify.success(response.message || 'Successfully joined the class!')
      setClassCode('')
      setShowJoinModal(false)
      if (onClassJoined) {
        onClassJoined()
      }
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to join class. Please check the code and try again.')
    } finally {
      setJoinLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const getDaysRemaining = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            📨 Class Invitations
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setShowJoinModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2"
        >
          <span>🔑</span> Join with Code
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
              <div className="h-6 bg-white/10 rounded w-1/3 mb-3" />
              <div className="h-4 bg-white/10 rounded w-1/2 mb-2" />
              <div className="h-4 bg-white/10 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : invitations.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
          <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center text-3xl mb-4">
            📭
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Pending Invitations</h3>
          <p className="text-gray-400 mb-6">
            When teachers invite you to their classes, they&apos;ll appear here
          </p>
          <button
            onClick={() => setShowJoinModal(true)}
            className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-lg font-medium hover:bg-white/20 transition-all"
          >
            Join a Class with Code
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {invitations.map((invitation) => (
            <div
              key={invitation._id}
              className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center text-2xl">
                      📚
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{invitation.className}</h3>
                      <p className="text-gray-400 text-sm">Invited by {invitation.teacherName}</p>
                    </div>
                  </div>
                  {invitation.message && (
                    <p className="text-gray-300 text-sm mt-3 bg-white/5 rounded-lg p-3 italic">
                      &ldquo;{invitation.message}&rdquo;
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>📅 Received {formatDate(invitation.createdAt)}</span>
                    <span className="text-yellow-400">
                      ⏳ Expires in {getDaysRemaining(invitation.expiresAt)} days
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleResponse(invitation._id, 'decline')}
                    disabled={actionLoading === invitation._id}
                    className="px-4 py-2 bg-white/5 border border-white/20 text-gray-300 rounded-lg hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleResponse(invitation._id, 'accept')}
                    disabled={actionLoading === invitation._id}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading === invitation._id ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>✓ Accept</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Join by Code Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Join Class with Code</h3>
              <button
                onClick={() => setShowJoinModal(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleJoinByCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enter Class Code
                </label>
                <input
                  type="text"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  placeholder="e.g., ABC12345"
                  maxLength={10}
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white text-center text-2xl tracking-widest font-mono placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 uppercase"
                />
                <p className="text-gray-500 text-xs mt-2">
                  Ask your teacher for the class code
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/20 text-gray-300 rounded-xl hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!classCode.trim() || joinLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {joinLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Join Class</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
