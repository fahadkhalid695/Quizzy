import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyToken } from '@/lib/auth-middleware';
import { generateClassCode } from '@/lib/validators';
import Class from '@/models/Class';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Verify token and get user
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can create classes' }, { status: 403 });
    }

    const { name, description } = await request.json();

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 });
    }

    if (name.length > 100) {
      return NextResponse.json({ error: 'Class name must be less than 100 characters' }, { status: 400 });
    }

    // Create class
    const classCode = generateClassCode();
    const newClass = new Class({
      name: name.trim(),
      description: description?.trim() || '',
      teacherId: payload.userId,
      code: classCode,
      students: [],
    });

    await newClass.save();

    return NextResponse.json(
      {
        success: true,
        class: {
          id: newClass._id,
          name: newClass.name,
          description: newClass.description,
          code: newClass.code,
          teacherId: newClass.teacherId,
          students: newClass.students,
          createdAt: newClass.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create class error:', error);
    return NextResponse.json({ error: 'Failed to create class' }, { status: 500 });
  }
}
