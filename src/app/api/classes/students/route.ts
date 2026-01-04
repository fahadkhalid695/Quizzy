import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import Class from '@/models/Class';
import User from '@/models/User';

// GET - Get students in a class
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

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) {
      return NextResponse.json({ error: 'Class ID is required' }, { status: 400 });
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc) {
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }

    // Verify teacher owns this class
    if (classDoc.teacherId.toString() !== payload.userId) {
      return NextResponse.json(
        { error: 'Only class teacher can view students' },
        { status: 403 }
      );
    }

    // Get student details - handle both string and ObjectId formats
    const studentIds = classDoc.students || [];
    const students: any[] = await User.find({ 
      $or: [
        { _id: { $in: studentIds } },
        { _id: { $in: studentIds.map((id: any) => id?.toString()).filter(Boolean) } }
      ]
    })
      .select('firstName lastName email')
      .lean();

    const formattedStudents = students.map((student: any) => ({
      id: student._id.toString(),
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
    }));

    return NextResponse.json({ students: formattedStudents });
  } catch (error) {
    console.error('Get students error:', error);
    return NextResponse.json({ error: 'Failed to get students' }, { status: 500 });
  }
}

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

    // Get updated student list
    const students = await User.find({ 
      $or: [
        { _id: { $in: classDoc.students } },
        { _id: { $in: classDoc.students.map((id: any) => id?.toString()).filter(Boolean) } }
      ]
    }).select('firstName lastName email');

    return NextResponse.json({
      success: true,
      message: 'Student added to class',
      class: {
        ...classDoc.toObject(),
        students: students.map(s => ({
          _id: s._id,
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email
        }))
      },
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

    // Support both query params and request body for backwards compatibility
    const { searchParams } = new URL(request.url);
    let classId = searchParams.get('classId');
    let studentId = searchParams.get('studentId');

    // If not in query params, try request body
    if (!classId || !studentId) {
      try {
        const body = await request.json();
        classId = body.classId || classId;
        studentId = body.studentId || studentId;
      } catch (e) {
        // Body parsing failed, continue with query params
      }
    }

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
    classDoc.students = classDoc.students.filter((id: any) => id.toString() !== studentId);
    await classDoc.save();

    // Also remove class from student's enrolled classes
    await User.findByIdAndUpdate(studentId, {
      $pull: { enrolledClasses: classId },
    });

    // Get updated student list
    const students = await User.find({ 
      $or: [
        { _id: { $in: classDoc.students } },
        { _id: { $in: classDoc.students.map((id: any) => id?.toString()).filter(Boolean) } }
      ]
    }).select('firstName lastName email');

    return NextResponse.json({
      success: true,
      message: 'Student removed from class',
      class: {
        ...classDoc.toObject(),
        students: students.map(s => ({
          _id: s._id,
          firstName: s.firstName,
          lastName: s.lastName,
          email: s.email
        }))
      },
    });
  } catch (error) {
    console.error('Remove student error:', error);
    return NextResponse.json({ error: 'Failed to remove student' }, { status: 500 });
  }
}
