'use client';

import { useState, useEffect } from 'react';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/FormElements';
import Card from '@/components/ui/Card';

interface ClassListProps {
  refreshTrigger?: number;
}

interface IClass {
  id: string;
  name: string;
  description: string;
  code: string;
  students: any[];
}

export default function ClassList({ refreshTrigger = 0 }: ClassListProps) {
  const [classes, setClasses] = useState<IClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<IClass | null>(null);
  const [studentEmail, setStudentEmail] = useState('');
  const [addingStudent, setAddingStudent] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    fetchClasses();
  }, [refreshTrigger]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ classes: any[] }>('/api/classes/list');
      // Map classes to ensure consistent id property
      const mappedClasses = (response.classes || []).map((cls: any) => ({
        id: cls._id || cls.id,
        name: cls.name,
        description: cls.description,
        code: cls.code,
        students: cls.students || [],
      }));
      setClasses(mappedClasses);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
      notify.error('Failed to fetch classes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !studentEmail.trim()) return;

    setAddingStudent(true);
    try {
      await api.post('/api/classes/students', {
        classId: selectedClass.id,
        studentEmail: studentEmail.trim(),
      });
      notify.success('Student added successfully');
      setStudentEmail('');
      fetchClasses();
      setSelectedClass(null);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to add student');
    } finally {
      setAddingStudent(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClass) return;

    try {
      await api.delete(`/api/classes/students?classId=${selectedClass.id}&studentId=${studentId}`);
      notify.success('Student removed');
      fetchClasses();
    } catch (error) {
      notify.error('Failed to remove student');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-400">Loading classes...</div>;
  }

  if (classes.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-12 text-center">
        <div className="text-4xl mb-4">📚</div>
        <p className="text-gray-400">No classes yet. Create one to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Classes List */}
      <div className="lg:col-span-1">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4">
          <h3 className="text-lg font-bold text-white mb-4">Your Classes ({classes.length})</h3>
          <div className="space-y-2">
            {classes.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
                className={`w-full text-left p-3 rounded-lg border transition ${
                  selectedClass?.id === cls.id
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-white/20 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="font-semibold text-white">{cls.name}</div>
                <div className="text-sm text-gray-400">Code: {cls.code}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {cls.students.length} student{cls.students.length !== 1 ? 's' : ''}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Class Details */}
      {selectedClass && (
        <div className="lg:col-span-2 space-y-4">
          {/* Add Student */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Add Student to Class</h3>
            <form onSubmit={handleAddStudent} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Student Email</label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@example.com"
                  required
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <Button type="submit" variant="primary" isLoading={addingStudent} className="w-full">
                Add Student
              </Button>
            </form>
          </div>

          {/* Students List */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Students ({selectedClass.students.length})</h3>
            {selectedClass.students.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No students enrolled yet</p>
            ) : (
              <div className="space-y-2">
                {selectedClass.students.map((student: any) => (
                  <div
                    key={student._id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-white">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-sm text-gray-400">{student.email}</div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveStudent(student._id)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Class Info */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Class Information</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-400">Class Code</label>
                <div className="font-mono text-lg text-purple-400 mt-1">{selectedClass.code}</div>
              </div>
              {selectedClass.description && (
                <div>
                  <label className="text-sm font-medium text-gray-400">Description</label>
                  <div className="text-gray-300 mt-1">{selectedClass.description}</div>
                </div>
              )}
              <a
                href={`/teacher/classes/${selectedClass.id}`}
                className="inline-block mt-4 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition"
              >
                View Tests & Details →
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
