import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import Class from '@/models/Class';
import User from '@/models/User';

export async function POST(request: NextRequest) {
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

    const { classId, studentEmail } = await request.json();

    if (!classId || !studentEmail) {
      return NextResponse.json(
        { error: 'Class ID and student email are required' },
        { status: 400 }
      );
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Verify teacher owns this class
    if (classDoc.teacherId.toString() !== payload.userId) {
      return NextResponse.json(
        { error: 'Only class teacher can add students' },
        { status: 403 }
      );
    }

    // Find student by email
    const student = await User.findOne({ email: studentEmail, role: 'student' });
    if (!student) {
      return NextResponse.json(
        { error: 'Student not found with this email' },
        { status: 404 }
      );
    }

    // Check if already enrolled
    if (classDoc.students.includes(student._id)) {
      return NextResponse.json(
        { error: 'Student already enrolled in this class' },
        { status: 400 }
      );
    }

    // Add student to class
    classDoc.students.push(student._id);
    await classDoc.save();

    await classDoc.populate('students', 'firstName lastName email');

    return NextResponse.json({
      success: true,
      message: 'Student added to class',
      class: classDoc,
    });
  } catch (error) {
    console.error('Add student error:', error);
    return NextResponse.json({ error: 'Failed to add student' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    const { classId, studentId } = await request.json();

    if (!classId || !studentId) {
      return NextResponse.json(
        { error: 'Class ID and student ID are required' },
        { status: 400 }
      );
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Verify teacher owns this class
    if (classDoc.teacherId.toString() !== payload.userId) {
      return NextResponse.json(
        { error: 'Only class teacher can remove students' },
        { status: 403 }
      );
    }

    // Remove student
    classDoc.students = classDoc.students.filter((id) => id.toString() !== studentId);
    await classDoc.save();

    await classDoc.populate('students', 'firstName lastName email');

    return NextResponse.json({
      success: true,
      message: 'Student removed from class',
      class: classDoc,
    });
  } catch (error) {
    console.error('Remove student error:', error);
    return NextResponse.json({ error: 'Failed to remove student' }, { status: 500 });
  }
}
