import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import Class from '@/models/Class';
import Test from '@/models/Test';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let classes: any[] = [];
    if (payload.role === 'teacher') {
      // Get classes taught by this teacher
      classes = await Class.find({ teacherId: payload.userId })
        .sort({ createdAt: -1 })
        .lean() as any[];
      
      // Get test counts for each class
      const classIds = classes.map((c: any) => c._id.toString());
      const testCounts = await Test.aggregate([
        { $match: { classId: { $in: classIds } } },
        { $group: { _id: '$classId', count: { $sum: 1 } } }
      ]);
      const testCountMap = new Map(testCounts.map((t: any) => [t._id, t.count]));
      
      // Get student details for each class
      const allStudentIds = [...new Set(classes.flatMap((c: any) => c.students || []))];
      const students = await User.find({ 
        $or: [
          { _id: { $in: allStudentIds } },
          { _id: { $in: allStudentIds.map((id: any) => id?.toString()).filter(Boolean) } }
        ]
      }).select('firstName lastName email').lean() as any[];
      const studentMap = new Map(students.map((s: any) => [s._id.toString(), s]));
      
      // Format response
      classes = classes.map((c: any) => ({
        _id: c._id,
        name: c.name,
        description: c.description,
        code: c.code,
        students: (c.students || []).map((sid: any) => {
          const student = studentMap.get(sid?.toString());
          return student ? {
            _id: sid,
            firstName: student.firstName,
            lastName: student.lastName,
            email: student.email
          } : { _id: sid, firstName: 'Unknown', lastName: 'Student', email: '' };
        }),
        testCount: testCountMap.get(c._id.toString()) || 0,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }));
    } else if (payload.role === 'student') {
      // Get classes student is enrolled in - handle both string and ObjectId
      classes = await Class.find({ 
        $or: [
          { students: payload.userId },
          { students: payload.userId.toString() }
        ]
      })
        .sort({ createdAt: -1 })
        .lean() as any[];
      
      // Get teacher details
      const teacherIds = [...new Set(classes.map((c: any) => c.teacherId))];
      const teachers = await User.find({ 
        $or: [
          { _id: { $in: teacherIds } },
          { _id: { $in: teacherIds.map((id: any) => id?.toString()).filter(Boolean) } }
        ]
      }).select('firstName lastName email').lean() as any[];
      const teacherMap = new Map(teachers.map((t: any) => [t._id.toString(), t]));
      
      // Get test counts
      const classIds = classes.map((c: any) => c._id.toString());
      const testCounts = await Test.aggregate([
        { $match: { classId: { $in: classIds }, isPublished: true } },
        { $group: { _id: '$classId', count: { $sum: 1 } } }
      ]) as any[];
      const testCountMap = new Map(testCounts.map((t: any) => [t._id, t.count]));
      
      // Format response
      classes = classes.map((c: any) => {
        const teacher = teacherMap.get(c.teacherId?.toString());
        return {
          _id: c._id,
          name: c.name,
          description: c.description,
          code: c.code,
          teacherId: teacher ? {
            _id: c.teacherId,
            firstName: teacher.firstName,
            lastName: teacher.lastName,
            email: teacher.email
          } : { _id: c.teacherId, firstName: 'Unknown', lastName: 'Teacher', email: '' },
          testCount: testCountMap.get(c._id.toString()) || 0,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        };
      });
    }

    return NextResponse.json({
      success: true,
      classes: classes || [],
    });
  } catch (error) {
    console.error('Get classes error:', error);
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
  }
}
