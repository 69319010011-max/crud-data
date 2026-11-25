'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';

interface Student {
  sid: number;
  sname: string;
  phon: number;
}

export default function StudentCrudPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    sid: '',
    sname: '',
    phon: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Auto-dismiss success notification
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch all students from API
  const fetchStudents = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/students');
      const json = await res.json();
      if (res.ok && json.success) {
        setStudents(json.data || []);
      } else {
        setErrorMessage(json.message || 'ไม่สามารถโหลดข้อมูลนักศึกษาได้');
      }
    } catch (err: any) {
      setErrorMessage(
        'เกิดข้อผิดพลาดในการเชื่อมต่อ API / ฐานข้อมูล PostgreSQL กรุณาตรวจสอบ .env.local'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Filtered students by search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm.trim()) return students;
    const term = searchTerm.toLowerCase();
    return students.filter(
      (s) =>
        s.sid.toString().includes(term) ||
        s.sname.toLowerCase().includes(term) ||
        s.phon.toString().includes(term)
    );
  }, [students, searchTerm]);

  // Open modal for creating new student
  const openCreateModal = () => {
    setEditingStudent(null);
    setFormData({ sid: '', sname: '', phon: '' });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing existing student
  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      sid: student.sid.toString(),
      sname: student.sname,
      phon: student.phon.toString(),
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for delete confirmation
  const openDeleteModal = (student: Student) => {
    setDeletingStudent(student);
    setIsDeleteModalOpen(true);
  };

  // Handle form submission (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const sidNum = parseInt(formData.sid, 10);
    const phonNum = parseInt(formData.phon, 10);
    const snameTrim = formData.sname.trim();

    if (!editingStudent && isNaN(sidNum)) {
      setFormError('กรุณากรอกรหัสนักศึกษา (sid) เป็นตัวเลข');
      return;
    }
    if (!snameTrim) {
      setFormError('กรุณากรอกชื่อ-นามสกุล (sname)');
      return;
    }
    if (isNaN(phonNum)) {
      setFormError('กรุณากรอกเบอร์โทรศัพท์ (phon) เป็นตัวเลข');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingStudent) {
        // Update (PUT)
        const res = await fetch(`/api/students/${editingStudent.sid}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sname: snameTrim, phon: phonNum }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setSuccessMessage(json.message || 'แก้ไขข้อมูลสำเร็จ');
          setIsModalOpen(false);
          fetchStudents();
        } else {
          setFormError(json.message || 'ไม่สามารถแก้ไขข้อมูลได้');
        }
      } else {
        // Create (POST)
        const res = await fetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sid: sidNum, sname: snameTrim, phon: phonNum }),
        });
        const json = await res.json();
        if (res.ok && json.success) {
          setSuccessMessage(json.message || 'เพิ่มข้อมูลนักศึกษาสำเร็จ');
          setIsModalOpen(false);
          fetchStudents();
        } else {
          setFormError(json.message || 'ไม่สามารถเพิ่มข้อมูลได้');
        }
      }
    } catch (err: any) {
      setFormError('เกิดข้อผิดพลาดในการส่งข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle student deletion
  const handleDelete = async () => {
    if (!deletingStudent) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/students/${deletingStudent.sid}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMessage(json.message || 'ลบข้อมูลนักศึกษาเรียบร้อย');
        setIsDeleteModalOpen(false);
        setDeletingStudent(null);
        fetchStudents();
      } else {
        setErrorMessage(json.message || 'ไม่สามารถลบข้อมูลได้');
      }
    } catch (err: any) {
      setErrorMessage('เกิดข้อผิดพลาดในการลบข้อมูล');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-2">
              PostgreSQL • Database: rytc • Table: student
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              ระบบจัดการข้อมูลนักศึกษา
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              เพิ่ม ค้นหา แก้ไข และลบข้อมูลนักศึกษาผ่าน Next.js และ node-postgres
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchStudents}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium transition duration-150 disabled:opacity-50"
            >
              <svg
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              รีเฟรช
            </button>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition duration-150"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                />
              </svg>
              เพิ่มนักศึกษาใหม่
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 flex items-center justify-between text-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-600 hover:text-emerald-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-rose-800 text-sm">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="space-y-1">
                <p className="font-semibold">{errorMessage}</p>
                <p className="text-xs text-rose-600">
                  หากยังไม่ได้กำหนดรหัสผ่านฐานข้อมูล ให้ตรวจสอบไฟล์ <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">.env.local</code> และใส่ <code className="bg-rose-100 px-1 py-0.5 rounded font-mono">PGPASSWORD=รหัสผ่าน</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stat & Search Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xl">
              🎓
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                จำนวนนักศึกษาทั้งหมด
              </p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">
                {students.length} <span className="text-sm font-normal text-slate-500">คน</span>
              </p>
            </div>
          </div>

          <div className="md:col-span-2 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center">
            <div className="relative w-full">
              <svg
                className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="ค้นหาด้วยรหัสนักศึกษา (sid), ชื่อ (sname), หรือเบอร์โทร (phon)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100 focus:bg-white text-sm text-slate-900 rounded-xl border border-slate-200 focus:border-blue-500 focus:outline-none transition duration-150"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ล้างคำค้น
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Student Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">รหัส (sid)</th>
                  <th className="py-3.5 px-6">ชื่อ-นามสกุล (sname)</th>
                  <th className="py-3.5 px-6">เบอร์โทรศัพท์ (phon)</th>
                  <th className="py-3.5 px-6 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p>กำลังโหลดข้อมูลนักศึกษา...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-400">
                      {searchTerm ? (
                        <p>ไม่พบข้อมูลที่ตรงกับคำค้นหา &ldquo;{searchTerm}&rdquo;</p>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-slate-500 font-medium">ยังไม่มีข้อมูลนักศึกษาในตาราง</p>
                          <button
                            onClick={openCreateModal}
                            className="text-blue-600 hover:text-blue-700 text-xs font-semibold"
                          >
                            + เพิ่มนักศึกษาคนแรก
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((student) => (
                    <tr
                      key={student.sid}
                      className="hover:bg-slate-50/80 transition duration-150"
                    >
                      <td className="py-4 px-6 font-mono font-medium text-slate-900">
                        <span className="inline-block px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold">
                          #{student.sid}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-900">
                        {student.sname}
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-mono">
                        {student.phon}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => openEditModal(student)}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium transition"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => openDeleteModal(student)}
                            className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-medium transition"
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3.5 bg-slate-50/60 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
            <span>
              แสดง {filteredStudents.length} จากทั้งหมด {students.length} รายการ
            </span>
            <span className="text-slate-400">PostgreSQL Schema: public.student</span>
          </div>
        </div>
      </div>

      {/* Create / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {editingStudent ? 'แก้ไขข้อมูลนักศึกษา' : 'เพิ่มข้อมูลนักศึกษาใหม่'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  รหัสนักศึกษา (sid) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="เช่น 1001"
                  disabled={Boolean(editingStudent)}
                  value={formData.sid}
                  onChange={(e) => setFormData({ ...formData, sid: e.target.value })}
                  className={`w-full px-3.5 py-2 rounded-xl border text-sm focus:outline-none transition ${
                    editingStudent
                      ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-not-allowed'
                      : 'border-slate-300 focus:border-blue-500 text-slate-900'
                  }`}
                  required
                />
                {editingStudent && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    รหัสนักศึกษา (Primary Key) ไม่สามารถแก้ไขได้
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  ชื่อ-นามสกุล (sname) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น สมชาย ใจดี"
                  value={formData.sname}
                  onChange={(e) => setFormData({ ...formData, sname: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 text-slate-900 text-sm focus:outline-none transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">
                  เบอร์โทรศัพท์ (phon) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="เช่น 0812345678"
                  value={formData.phon}
                  onChange={(e) => setFormData({ ...formData, phon: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-blue-500 text-slate-900 text-sm focus:outline-none transition"
                  required
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium shadow-sm transition disabled:opacity-50"
                >
                  {isSubmitting ? 'กำลังบันทึก...' : editingStudent ? 'บันทึกการแก้ไข' : 'เพิ่มข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center text-xl">
              🗑️
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">ยืนยันการลบข้อมูล</h3>
              <p className="text-sm text-slate-500 mt-1">
                คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลของ{' '}
                <strong className="text-slate-800">{deletingStudent.sname}</strong> (รหัส #{deletingStudent.sid})?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-medium transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
