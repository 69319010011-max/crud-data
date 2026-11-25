import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { Student } from '../route';

interface RouteContext {
  params: Promise<{
    sid: string;
  }>;
}

// GET: Retrieve a single student by sid
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { sid } = await context.params;
    const sidNum = parseInt(sid, 10);

    if (isNaN(sidNum)) {
      return NextResponse.json(
        { success: false, message: 'รหัสนักศึกษาไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const result = await pool.query<Student>(
      'SELECT sid, sname, phon FROM student WHERE sid = $1',
      [sidNum]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลนักศึกษา' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error fetching student:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

// PUT: Update student by sid
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { sid } = await context.params;
    const sidNum = parseInt(sid, 10);

    if (isNaN(sidNum)) {
      return NextResponse.json(
        { success: false, message: 'รหัสนักศึกษาไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { sname, phon } = body;

    if (!sname || typeof sname !== 'string' || sname.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'กรุณาระบุชื่อ-นามสกุล' },
        { status: 400 }
      );
    }

    if (phon === undefined || phon === null || isNaN(Number(phon))) {
      return NextResponse.json(
        { success: false, message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข' },
        { status: 400 }
      );
    }

    const phonNum = parseInt(phon, 10);
    const snameTrim = sname.trim();

    const result = await pool.query<Student>(
      'UPDATE student SET sname = $1, phon = $2 WHERE sid = $3 RETURNING sid, sname, phon',
      [snameTrim, phonNum, sidNum]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลนักศึกษาที่ต้องการแก้ไข' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'แก้ไขข้อมูลนักศึกษาเรียบร้อยแล้ว',
    });
  } catch (error: any) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Database error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete student by sid
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { sid } = await context.params;
    const sidNum = parseInt(sid, 10);

    if (isNaN(sidNum)) {
      return NextResponse.json(
        { success: false, message: 'รหัสนักศึกษาไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    const result = await pool.query<Student>(
      'DELETE FROM student WHERE sid = $1 RETURNING sid, sname, phon',
      [sidNum]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลนักศึกษาที่ต้องการลบ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'ลบข้อมูลนักศึกษาเรียบร้อยแล้ว',
    });
  } catch (error: any) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Database error' },
      { status: 500 }
    );
  }
}
