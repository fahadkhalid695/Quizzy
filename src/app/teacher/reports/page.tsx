'use client';

import { useState, useEffect } from 'react';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import BackButton from '@/components/common/BackButton';

interface ClassReport {
  classId: string;
  className: string;
  totalStudents: number;
  totalTests: number;
  classAverage: number;
  totalResults: number;
  students: StudentReport[];
}

interface StudentReport {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  totalTests: number;
  averagePercentage: number;
  testResults: TestResultSummary[];
}

interface TestResultSummary {
  testId: string;
  testTitle: string;
  percentage: number;
  obtainedMarks: number;
  totalMarks: number;
}

interface ClassSummary {
  id: string;
  name: string;
  code: string;
  studentCount: number;
}

export default function ReportsPage() {
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [report, setReport] = useState<ClassReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState<string | null>(null);
  const notify = useNotify();

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchReport(selectedClass);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ classes: any[] }>('/api/classes/list');
      // Map _id to id for consistency
      const mappedClasses = (response.classes || []).map((cls: any) => ({
        id: cls._id || cls.id,
        name: cls.name,
        code: cls.code,
        studentCount: cls.students?.length || 0,
      }));
      setClasses(mappedClasses);
      if (mappedClasses.length > 0) {
        setSelectedClass(mappedClasses[0].id);
      }
    } catch (error) {
      notify.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const fetchReport = async (classId: string) => {
    try {
      setReportLoading(true);
      const response = await api.get<{ report: ClassReport }>(`/api/reports/class/${classId}`);
      setReport(response.report);
    } catch (error) {
      notify.error('Failed to load report');
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadCSV = async () => {
    if (!selectedClass) return;
    
    try {
      setDownloadLoading('csv');
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/class/${selectedClass}/download?format=csv`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report?.className || 'class'}_report.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      notify.success('Report downloaded successfully!');
    } catch (error) {
      notify.error('Failed to download report');
    } finally {
      setDownloadLoading(null);
    }
  };

  const handleDownloadJSON = async () => {
    if (!selectedClass) return;
    
    try {
      setDownloadLoading('json');
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/class/${selectedClass}/download?format=json`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report?.className || 'class'}_report.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      notify.success('Report downloaded successfully!');
    } catch (error) {
      notify.error('Failed to download report');
    } finally {
      setDownloadLoading(null);
    }
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-blue-400';
    if (percentage >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getGradeBadge = (percentage: number) => {
    if (percentage >= 90) return { grade: 'A+', bg: 'bg-green-500/20', text: 'text-green-400' };
    if (percentage >= 80) return { grade: 'A', bg: 'bg-green-500/20', text: 'text-green-400' };
    if (percentage >= 70) return { grade: 'B', bg: 'bg-blue-500/20', text: 'text-blue-400' };
    if (percentage >= 60) return { grade: 'C', bg: 'bg-cyan-500/20', text: 'text-cyan-400' };
    if (percentage >= 50) return { grade: 'D', bg: 'bg-yellow-500/20', text: 'text-yellow-400' };
    if (percentage >= 40) return { grade: 'E', bg: 'bg-orange-500/20', text: 'text-orange-400' };
    return { grade: 'F', bg: 'bg-red-500/20', text: 'text-red-400' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <BackButton href="/teacher/dashboard" label="Dashboard" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-white">📊 Reports & Analytics</h1>
            <p className="text-gray-400 mt-2">View detailed performance reports for your classes</p>
          </div>
          
          {/* Class Selector */}
          <select
            value={selectedClass || ''}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:border-purple-500"
          >
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id} className="bg-slate-900">
                {cls.name}
              </option>
            ))}
          </select>
        </div>

        {reportLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : report ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="text-3xl mb-2">👥</div>
                <div className="text-3xl font-bold text-white">{report.totalStudents}</div>
                <div className="text-gray-400 text-sm">Total Students</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="text-3xl mb-2">📝</div>
                <div className="text-3xl font-bold text-white">{report.totalTests}</div>
                <div className="text-gray-400 text-sm">Total Tests</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="text-3xl mb-2">📈</div>
                <div className={`text-3xl font-bold ${getGradeColor(report.classAverage)}`}>
                  {report.classAverage}%
                </div>
                <div className="text-gray-400 text-sm">Class Average</div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-3xl font-bold text-white">{report.totalResults}</div>
                <div className="text-gray-400 text-sm">Submissions</div>
              </div>
            </div>

            {/* Download Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                onClick={handleDownloadCSV}
                isLoading={downloadLoading === 'csv'}
                className="flex items-center gap-2"
              >
                📥 Download CSV
              </Button>
              <Button
                variant="secondary"
                onClick={handleDownloadJSON}
                isLoading={downloadLoading === 'json'}
                className="flex items-center gap-2"
              >
                📥 Download JSON
              </Button>
            </div>

            {/* Student Performance Table */}
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">Student Performance</h2>
                <p className="text-gray-400 text-sm mt-1">Ranked by average score</p>
              </div>
              
              {report.students.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  <div className="text-4xl mb-4">📭</div>
                  <p>No test submissions yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5">
                        <th className="text-left p-4 text-gray-400 font-medium">Rank</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Student</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Tests Taken</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Average</th>
                        <th className="text-left p-4 text-gray-400 font-medium">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.students.map((student, index) => {
                        const grade = getGradeBadge(student.averagePercentage);
                        return (
                          <tr key={student.id} className="border-b border-white/5 hover:bg-white/5 transition">
                            <td className="p-4">
                              <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                                index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                index === 1 ? 'bg-gray-400/20 text-gray-300' :
                                index === 2 ? 'bg-orange-500/20 text-orange-400' :
                                'bg-white/5 text-gray-400'
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                  {student.firstName[0]}{student.lastName[0]}
                                </div>
                                <div>
                                  <p className="text-white font-medium">{student.firstName} {student.lastName}</p>
                                  <p className="text-gray-400 text-sm">{student.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-gray-300">{student.totalTests}</td>
                            <td className="p-4">
                              <span className={`font-bold ${getGradeColor(student.averagePercentage)}`}>
                                {student.averagePercentage}%
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`px-3 py-1 rounded-full font-bold ${grade.bg} ${grade.text}`}>
                                {grade.grade}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
            <div className="text-4xl mb-4">📊</div>
            <p className="text-gray-400">Select a class to view reports</p>
          </div>
        )}
      </div>
    </div>
  );
}
