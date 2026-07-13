import { supabase } from '@lib/supabase'

export async function checkPublicBilling({ registrationNumber, pin }) {
  const { data: student, error } = await supabase
    .from('students')
    .select(`
      id, name, registration_code, pin,
      classes (id, name),
      enrollments!inner (id, program_type)
    `)
    .eq('registration_code', registrationNumber)
    .eq('pin', pin)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw new Error('Gagal memuat data. Coba lagi.')
  if (!student) throw new Error('Data tidak ditemukan atau PIN salah.')

  const programType = student.enrollments?.[0]?.program_type || 'Reguler'

  const { data: bills } = await supabase
    .from('student_bills')
    .select('*')
    .eq('student_id', student.id)
    .order('due_date', { ascending: true })

  const { data: payments } = await supabase
    .from('student_payments')
    .select('*')
    .eq('student_id', student.id)
    .order('payment_date', { ascending: false })
    .limit(50)

  const liabilities = (bills || []).map(b => ({
    id: b.id,
    description: b.description,
    amount: b.amount,
    dueDate: b.due_date,
    isPaid: b.is_paid || false,
  }))

  const totalLiabilities = liabilities.reduce((s, l) => s + (l.isPaid ? 0 : l.amount), 0)
  const totalPaid = (payments || []).reduce((s, p) => s + p.amount, 0)
  const balance = totalLiabilities - totalPaid

  return {
    student: {
      name: student.name,
      registrationNumber: student.registration_code,
      className: student.classes?.name || '-',
      program: programType,
    },
    billing: {
      totalLiabilities,
      totalPaid,
      balance: Math.max(0, balance),
      lastPaymentDate: payments?.[0]?.payment_date || null,
    },
    liabilities,
    recentPayments: (payments || []).map(p => ({
      id: p.id,
      amount: p.amount,
      method: p.method || 'Transfer',
      paymentDate: p.payment_date,
      note: p.note || '',
    })),
  }
}
