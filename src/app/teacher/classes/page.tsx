'use client';

import { useState } from 'react';
import ClassForm from '@/components/teacher/ClassForm';
import ClassList from '@/components/teacher/ClassList';
import BackButton from '@/components/common/BackButton';

export default function ClassesPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <BackButton href="/teacher/dashboard" label="Dashboard" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white">📚 Class Management</h1>
            <p className="text-gray-400 mt-1">Create and manage your classes</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition transform hover:scale-105"
          >
            {showForm ? '✕ Cancel' : '+ New Class'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <ClassForm
            onSuccess={() => {
              setShowForm(false);
              setRefreshTrigger((prev) => prev + 1);
            }}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* Classes List */}
        <ClassList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}
