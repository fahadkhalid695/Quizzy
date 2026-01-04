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
      const response = await api.get('/api/classes/list');
      setClasses(response.classes || []);
    } catch (error) {
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
      await api.delete('/api/classes/students', {
        classId: selectedClass.id,
        studentId,
      });
      notify.success('Student removed');
      fetchClasses();
    } catch (error) {
      notify.error('Failed to remove student');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading classes...</div>;
  }

  if (classes.length === 0) {
    return (
      <Card>
        <Card.Body>
          <p className="text-center text-gray-500">No classes yet. Create one to get started!</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Classes List */}
      <div className="lg:col-span-1">
        <Card>
          <Card.Header title={`Your Classes (${classes.length})`} />
          <Card.Body>
            <div className="space-y-2">
              {classes.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition ${
                    selectedClass?.id === cls.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{cls.name}</div>
                  <div className="text-sm text-gray-500">Code: {cls.code}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {cls.students.length} student{cls.students.length !== 1 ? 's' : ''}
                  </div>
                </button>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Class Details */}
      {selectedClass && (
        <div className="lg:col-span-2 space-y-4">
          {/* Add Student */}
          <Card>
            <Card.Header title="Add Student to Class" />
            <Card.Body>
              <form onSubmit={handleAddStudent} className="space-y-3">
                <Input
                  label="Student Email"
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@example.com"
                  required
                />
                <Button type="submit" variant="primary" loading={addingStudent} className="w-full">
                  Add Student
                </Button>
              </form>
            </Card.Body>
          </Card>

          {/* Students List */}
          <Card>
            <Card.Header title={`Students (${selectedClass.students.length})`} />
            <Card.Body>
              {selectedClass.students.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No students enrolled yet</p>
              ) : (
                <div className="space-y-2">
                  {selectedClass.students.map((student: any) => (
                    <div
                      key={student._id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{student.email}</div>
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
            </Card.Body>
          </Card>

          {/* Class Info */}
          <Card>
            <Card.Header title="Class Information" />
            <Card.Body>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Class Code</label>
                  <div className="font-mono text-lg text-indigo-600 mt-1">{selectedClass.code}</div>
                </div>
                {selectedClass.description && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <div className="text-gray-700 mt-1">{selectedClass.description}</div>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
}
