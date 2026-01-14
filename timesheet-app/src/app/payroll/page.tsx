import { Play, Eye } from 'lucide-react';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getPayrolls() {
    return prisma.payroll.findMany({
        include: {
            employee: true,
            timesheet: true,
        },
        orderBy: { createdAt: 'desc' },
    });
}

function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(date));
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
}

export default async function PayrollPage() {
    const payrolls = await getPayrolls();

    // Calculate totals
    const totals = payrolls.reduce((acc, p) => {
        acc.gross += p.grossPay.toNumber();
        acc.net += p.netPay.toNumber();
        acc.taxes += p.taxes.toNumber();
        if (p.status === 'pending') acc.pending += p.grossPay.toNumber();
        if (p.status === 'processed') acc.processed += p.grossPay.toNumber();
        return acc;
    }, { gross: 0, net: 0, taxes: 0, pending: 0, processed: 0 });

    return (
        <>
            <header className="page-header">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="page-title">Payroll</h1>
                        <p className="page-subtitle">Process and track employee payments</p>
                    </div>
                    <Link href="/payroll/process" className="btn btn-primary">
                        <Play size={18} />
                        Process Payroll
                    </Link>
                </div>
            </header>

            <div className="page-content">
                {/* Summary Cards */}
                <div className="stats-grid" style={{ marginBottom: '24px' }}>
                    <div className="stat-card">
                        <div className="stat-value">{formatCurrency(totals.gross)}</div>
                        <div className="stat-label">Total Gross Pay</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{formatCurrency(totals.net)}</div>
                        <div className="stat-label">Total Net Pay</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--accent-red)' }}>
                            {formatCurrency(totals.taxes)}
                        </div>
                        <div className="stat-label">Total Taxes</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--status-pending)' }}>
                            {formatCurrency(totals.pending)}
                        </div>
                        <div className="stat-label">Pending Processing</div>
                    </div>
                </div>

                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Period</th>
                                    <th>Gross Pay</th>
                                    <th>Taxes</th>
                                    <th>Net Pay</th>
                                    <th>Status</th>
                                    <th>Processed</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payrolls.map((p) => (
                                    <tr key={p.id}>
                                        <td style={{ fontWeight: 500 }}>{p.employee.name}</td>
                                        <td className="text-sm text-muted">
                                            {formatDate(p.timesheet.periodStart)} - {formatDate(p.timesheet.periodEnd)}
                                        </td>
                                        <td className="font-mono">{formatCurrency(p.grossPay.toNumber())}</td>
                                        <td className="font-mono" style={{ color: 'var(--accent-red)' }}>
                                            -{formatCurrency(p.taxes.toNumber())}
                                        </td>
                                        <td className="font-mono" style={{ color: 'var(--accent-green)' }}>
                                            {formatCurrency(p.netPay.toNumber())}
                                        </td>
                                        <td>
                                            <span className={`badge ${p.status}`}>{p.status}</span>
                                        </td>
                                        <td className="text-sm text-muted">
                                            {p.processedAt ? formatDate(p.processedAt) : '-'}
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <Link href={`/payroll/${p.id}`} className="btn btn-ghost btn-icon">
                                                    <Eye size={16} />
                                                </Link>
                                                {p.status === 'pending' && (
                                                    <form action={`/api/payroll/${p.id}/process`} method="POST">
                                                        <button type="submit" className="btn btn-ghost btn-icon" style={{ color: 'var(--accent-green)' }}>
                                                            <Play size={16} />
                                                        </button>
                                                    </form>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
