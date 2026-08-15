import React, { memo } from 'react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'

const fmtMoney = (n) => 'Rp' + (n || 0).toLocaleString('id-ID')

export const PaymentTrendChart = memo(function PaymentTrendChart({ chartData, loading, total }) {
    return (
        <div className="glass rounded-[1.5rem] p-5 flex flex-col h-full min-h-[280px] relative overflow-hidden group hover:shadow-2xl hover:shadow-[var(--color-primary)]/5 transition-all duration-500">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />

            <div className="relative z-10 flex items-center justify-between mb-5 gap-3">
                <div className="min-w-0">
                    <p className="text-[13px] font-black text-[var(--color-text)]">Tren Pembayaran</p>
                    <p className="text-[10px] text-[var(--color-text-muted)] opacity-70 mt-0.5">7 hari terakhir</p>
                </div>
                {!loading && (
                    <div className="text-right shrink-0">
                        <p className="text-[14px] font-black text-emerald-500 leading-none tabular-nums">{fmtMoney(total)}</p>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--color-text-muted)] opacity-60 mt-0.5">Total minggu ini</p>
                    </div>
                )}
            </div>

            <div className="relative z-10 flex-1 min-h-[200px]">
                {loading ? (
                    <div className="w-full h-full bg-[var(--color-surface-alt)] animate-pulse rounded-2xl" />
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorPayments" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                            <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} axisLine={false} tickLine={false} dy={10} />
                            <YAxis stroke="var(--color-text-muted)" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${Math.round(v / 1000)}k` : v} dx={-6} />
                            <Tooltip
                                formatter={(value) => [fmtMoney(value), 'Pemasukan']}
                                contentStyle={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', fontSize: 11 }}
                                cursor={{ fill: 'var(--color-surface-alt)' }}
                            />
                            <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorPayments)" />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    )
})