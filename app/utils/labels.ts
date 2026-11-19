// ป้ายข้อความภาษาไทยที่ใช้ร่วมกันทุกหน้า (Nuxt auto-import จากโฟลเดอร์ utils)
export const roleLabel: Record<string, string> = {
  admin: 'ผู้ดูแลระบบ', technician: 'ช่างซ่อม', user: 'ผู้ใช้งาน'
}
export const statusLabel: Record<string, string> = {
  pending: 'รอจัดสรรช่าง', assigned: 'รอช่างรับงาน', in_progress: 'กำลังซ่อม', done: 'ซ่อมเสร็จ', cancelled: 'ยกเลิก'
}
export const statusColor: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', assigned: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-indigo-100 text-indigo-700', done: 'bg-green-100 text-green-700', cancelled: 'bg-slate-200 text-slate-600'
}
export const priorityLabel: Record<string, string> = { low: 'ต่ำ', normal: 'ปกติ', high: 'เร่งด่วน' }
export const actionLabel: Record<string, string> = {
  created: 'แจ้งซ่อม', edited: 'แก้ไขข้อมูล', assigned: 'มอบหมายช่าง', accepted: 'ช่างรับงาน',
  rejected: 'ช่างปฏิเสธงาน', completed: 'ซ่อมเสร็จ', cancelled: 'ยกเลิกงาน'
}
export const fmtDate = (s: string) =>
  new Date(s).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
