import { Send, DollarSign, Eye, FileText } from 'lucide-react';
import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getInvoices() {
    return prisma.invoice.findMany({
        include: {
            client: true,
            timesheet: {
                include: { employee: true },
            },
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

export default async function InvoicesPage() {
    const invoices = await getInvoices();

    // Calculate totals by status
    const totals = invoices.reduce((acc, inv) => {
        const amount = inv.amount.toNumber();
        acc[inv.status] = (acc[inv.status] || 0) + amount;
        acc.total += amount;
        return acc;
    }, { total: 0 } as Record<string, number>);

    return (
        <>
            <header className="page-header">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="page-title">Invoices</h1>
                        <p className="page-subtitle">Track and manage client invoices</p>
                    </div>
                    <Link href="/invoices/generate" className="btn btn-primary">
                        <FileText size={18} />
                        Generate Invoice
                    </Link>
                </div>
            </header>

            <div className="page-content">
                {/* Summary Cards */}
                <div className="stats-grid" style={{ marginBottom: '24px' }}>
                    <div className="stat-card">
                        <div className="stat-value">{formatCurrency(totals.total)}</div>
                        <div className="stat-label">Total Invoiced</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--accent-green)' }}>
                            {formatCurrency(totals.paid || 0)}
                        </div>
                        <div className="stat-label">Paid</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>
                            {formatCurrency(totals.sent || 0)}
                        </div>
                        <div className="stat-label">Sent (Awaiting Payment)</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--text-secondary)' }}>
                            {formatCurrency(totals.draft || 0)}
                        </div>
                        <div className="stat-label">Draft</div>
                    </div>
                </div>

                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Invoice #</th>
                                    <th>Client</th>
                                    <th>Employee</th>
                                    <th>Period</th>
                                    <th>Amount</th>
                                    <th>Due Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((inv) => (
                                    <tr key={inv.id}>
                                        <td className="font-mono" style={{ fontWeight: 500 }}>
                                            {inv.invoiceNo}
                                        </td>
                                        <td>{inv.client.name}</td>
                                        <td>{inv.timesheet.employee.name}</td>
                                        <td className="text-sm text-muted">
                                            {formatDate(inv.timesheet.periodStart)} - {formatDate(inv.timesheet.periodEnd)}
                                        </td>
                                        <td className="font-mono">{formatCurrency(inv.amount.toNumber())}</td>
                                        <td className="text-sm">
                                            {formatDate(inv.dueDate)}
                                            {new Date(inv.dueDate) < new Date() && inv.status !== 'paid' && (
                                                <span style={{ color: 'var(--accent-red)', marginLeft: '8px' }}>Overdue</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`badge ${inv.status}`}>{inv.status}</span>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <Link href={`/invoices/${inv.id}`} className="btn btn-ghost btn-icon">
                                                    <Eye size={16} />
                                                </Link>
                                                {inv.status === 'draft' && (
                                                    <form action={`/api/invoices/${inv.id}/send`} method="POST">
                                                        <button type="submit" className="btn btn-ghost btn-icon" style={{ color: 'var(--accent-blue)' }}>
                                                            <Send size={16} />
                                                        </button>
                                                    </form>
                                                )}
                                                {inv.status === 'sent' && (
                                                    <form action={`/api/invoices/${inv.id}/mark-paid`} method="POST">
                                                        <button type="submit" className="btn btn-ghost btn-icon" style={{ color: 'var(--accent-green)' }}>
                                                            <DollarSign size={16} />
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
