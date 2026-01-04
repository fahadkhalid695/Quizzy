'use client';

import { useEffect, useState } from 'react';
import { useNotify } from '@/components/common/Notification';
import { api } from '@/lib/api-client';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface ReportCardProps {
  classId: string;
}

export default function ClassReport({ classId }: ReportCardProps) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();

  useEffect(() => {
    fetchReport();
  }, [classId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get<{ report: any }>(`/api/reports/class/${classId}`);
      setReport(response.report);
    } catch (error) {
      notify.error('Failed to fetch report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    // Generate PDF report
    const content = `
CLASS REPORT
============
Class: ${report.className}
Date: ${new Date().toLocaleDateString()}

STATISTICS
----------
Total Students: ${report.totalStudents}
Total Tests: ${report.totalTests}
Class Average: ${report.classAverage}%

STUDENT PERFORMANCE
-------------------
${report.students.map((s: any) => `
${s.firstName} ${s.lastName}
  Average: ${s.averagePercentage}%
  Total Tests: ${s.totalTests}
  Total Marks: ${s.obtainedMarks}/${s.totalMarks}
`).join('\n')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `class-report-${classId}.txt`;
    a.click();
  };

  if (loading) {
    return <div className="text-center py-8">Loading report...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <Card.Header title="📊 Class Report" />
        <Card.Body className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{report?.totalStudents || 0}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{report?.totalTests || 0}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {report?.classAverage || 0}%
              </div>
              <div className="text-sm text-gray-600">Class Average</div>
            </div>
          </div>

          {/* Student Performance Table */}
          <div>
            <h3 className="font-bold text-lg text-white mb-4">Student Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-white/20">
                    <th className="text-left py-2 px-4 font-semibold text-white">Student</th>
                    <th className="text-center py-2 px-4 font-semibold text-white">Tests</th>
                    <th className="text-center py-2 px-4 font-semibold text-white">Average</th>
                    <th className="text-center py-2 px-4 font-semibold text-white">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {report?.students?.map((student: any) => (
                    <tr key={student.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4 font-medium text-white">
                        {student.firstName} {student.lastName}
                      </td>
                      <td className="py-3 px-4 text-center text-gray-300">{student.totalTests}</td>
                      <td className="py-3 px-4 text-center font-bold text-purple-400">
                        {student.averagePercentage}%
                      </td>
                      <td className="py-3 px-4 text-center text-gray-300">
                        {student.obtainedMarks}/{student.totalMarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Download Button */}
          <Button variant="primary" onClick={handleDownloadPDF} className="w-full">
            📥 Download Report
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
}
