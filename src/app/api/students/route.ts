import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export interface Student {
  sid: number;
  sname: string;
  phon: number;
}

// GET: Retrieve all students
export async function GET() {
  try {
    const result = await pool.query<Student>(
      'SELECT sid, sname, phon FROM student ORDER BY sid ASC'
    );
    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Database connection error',
        code: error.code,
      },
      { status: 500 }
    );
  }
}

// POST: Create a new student
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sid, sname, phon } = body;

    // Validate inputs
    if (sid === undefined || sid === null || isNaN(Number(sid))) {
      return NextResponse.json(
        { success: false, message: 'รหัสนักศึกษา (sid) ต้องเป็นตัวเลข' },
        { status: 400 }
      );
    }

    if (!sname || typeof sname !== 'string' || sname.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุชื่อ-นามสกุล (sname)' },
        { status: 400 }
      );
    }

    if (phon === undefined || phon === null || isNaN(Number(phon))) {
      return NextResponse.json(
        { success: false, message: 'เบอร์โทรศัพท์ (phon) ต้องเป็นตัวเลข' },
        { status: 400 }
      );
    }

    const sidNum = parseInt(sid, 10);
    const phonNum = parseInt(phon, 10);
    const snameTrim = sname.trim();

    const result = await pool.query<Student>(
      'INSERT INTO student (sid, sname, phon) VALUES ($1, $2, $3) RETURNING sid, sname, phon',
      [sidNum, snameTrim, phonNum]
    );

    return NextResponse.json(
      {
        success: true,
        data: result.rows[0],
        message: 'เพิ่มข้อมูลนักศึกษาเรียบร้อยแล้ว',
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating student:', error);
    if (error.code === '23505') {
      return NextResponse.json(
        { success: false, message: 'รหัสนักศึกษานี้ (sid) มีอยู่ในระบบแล้ว' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Database error occurred',
      },
      { status: 500 }
    );
  }
}
