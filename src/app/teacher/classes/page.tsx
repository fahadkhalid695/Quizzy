'use client';

import { useState } from 'react';
import ClassForm from '@/components/teacher/ClassForm';
import ClassList from '@/components/teacher/ClassList';
import Card from '@/components/ui/Card';

export default function ClassesPage() {
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">📚 Class Management</h1>
            <p className="text-gray-500 mt-1">Create and manage your classes</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
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
