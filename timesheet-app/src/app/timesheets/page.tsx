import { Check, X, Eye, Upload } from 'lucide-react';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import RawDataViewer from '@/components/RawDataViewer';

export const dynamic = 'force-dynamic';

async function getTimesheets() {
    return prisma.timesheet.findMany({
        include: {
            employee: {
                include: {
                    assignments: {
                        include: { client: true },
                        where: { endDate: null },
                    },
                },
            },
            invoice: true,
            payroll: true,
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

export default async function TimesheetsPage() {
    const timesheets = await getTimesheets();

    return (
        <>
            <header className="page-header">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="page-title">Timesheets</h1>
                        <p className="page-subtitle">Review and approve employee timesheets</p>
                    </div>
                    <Link href="/timesheets/upload" className="btn btn-primary">
                        <Upload size={18} />
                        Upload Timesheet
                    </Link>
                </div>
            </header>

            <div className="page-content">
                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6">
                    <button className="btn btn-primary">All</button>
                    <button className="btn btn-secondary">Pending</button>
                    <button className="btn btn-secondary">Approved</button>
                    <button className="btn btn-secondary">Rejected</button>
                </div>

                <div className="card">
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Client</th>
                                    <th>Period</th>
                                    <th>Regular Hrs</th>
                                    <th>OT Hrs</th>
                                    <th>Estimated Bill</th>
                                    <th>Source</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {timesheets.map((ts) => {
                                    const assignment = ts.employee.assignments[0];
                                    const billRate = assignment?.billRate.toNumber() || 0;
                                    const regularHours = ts.regularHours.toNumber();
                                    const overtimeHours = ts.overtimeHours.toNumber();
                                    const estimatedBill = (regularHours * billRate) + (overtimeHours * billRate * 1.5);

                                    return (
                                        <tr key={ts.id}>
                                            <td style={{ fontWeight: 500 }}>{ts.employee.name}</td>
                                            <td>{assignment?.client.name || '-'}</td>
                                            <td className="text-sm text-muted">
                                                {formatDate(ts.periodStart)} - {formatDate(ts.periodEnd)}
                                            </td>
                                            <td className="font-mono">{regularHours}</td>
                                            <td className="font-mono">{overtimeHours > 0 ? overtimeHours : '-'}</td>
                                            <td className="font-mono">{formatCurrency(estimatedBill)}</td>
                                            <td>
                                                <span className={`badge ${ts.sourceType === 'email' ? 'sent' : 'draft'}`}>
                                                    {ts.sourceType}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${ts.status}`}>{ts.status}</span>
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <Link href={`/timesheets/${ts.id}`} className="btn btn-ghost btn-icon">
                                                        <Eye size={16} />
                                                    </Link>
                                                    <RawDataViewer data={ts.rawData} />
                                                    {ts.status === 'pending' && (
                                                        <>
                                                            <form action={`/api/timesheets/${ts.id}/approve`} method="POST">
                                                                <button type="submit" className="btn btn-ghost btn-icon" style={{ color: 'var(--accent-green)' }}>
                                                                    <Check size={16} />
                                                                </button>
                                                            </form>
                                                            <form action={`/api/timesheets/${ts.id}/reject`} method="POST">
                                                                <button type="submit" className="btn btn-ghost btn-icon" style={{ color: 'var(--accent-red)' }}>
                                                                    <X size={16} />
                                                                </button>
                                                            </form>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}
