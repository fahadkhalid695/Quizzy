import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import Class from '@/models/Class';
import User from '@/models/User';

export async function GET(request: NextRequest, props: { params: Promise<{ classId: string }> }) {
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

    const { classId } = await props.params;
    const classDoc = await Class.findById(classId);

    if (!classDoc) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Manually fetch teacher and students since IDs are stored as strings
    const [teacher, students] = await Promise.all([
      User.findById(classDoc.teacherId).select('firstName lastName email'),
      User.find({ 
        $or: [
          { _id: { $in: classDoc.students || [] } },
          { _id: { $in: (classDoc.students || []).map((id: any) => id?.toString()).filter(Boolean) } }
        ]
      }).select('firstName lastName email')
    ]);

    return NextResponse.json({
      success: true,
      class: {
        id: classDoc._id,
        name: classDoc.name,
        description: classDoc.description,
        code: classDoc.code,
        teacherId: teacher ? {
          _id: classDoc.teacherId,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email
        } : { _id: classDoc.teacherId, firstName: 'Unknown', lastName: 'Teacher', email: '' },
        students: students.map(s => ({
          _id: s._id,
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email
        })),
        createdAt: classDoc.createdAt,
      },
    });
  } catch (error) {
    console.error('Get class error:', error);
    return NextResponse.json({ error: 'Failed to fetch class' }, { status: 500 });
  }
}
