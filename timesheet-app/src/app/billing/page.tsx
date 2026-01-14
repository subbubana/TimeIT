import prisma from '@/lib/prisma';
import { DollarSign, Users, TrendingUp, Download } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface TimesheetWithRelations {
    id: string;
    regularHours: { toNumber: () => number };
    overtimeHours: { toNumber: () => number };
    periodStart: Date;
    periodEnd: Date;
    status: string;
    employee: {
        id: string;
        name: string;
        assignments: Array<{
            billRate: { toNumber: () => number };
            payRate: { toNumber: () => number };
            client: {
                id: string;
                name: string;
            };
        }>;
    };
}

interface ClientGroup {
    clientId: string;
    clientName: string;
    employees: Array<{
        employeeId: string;
        employeeName: string;
        totalHours: number;
        overtimeHours: number;
        billRate: number;
        payRate: number;
        billTotal: number;
        payrollTotal: number;
    }>;
    totalBill: number;
    totalPayroll: number;
}

async function getBillingSummary(): Promise<ClientGroup[]> {
    const timesheets = await prisma.timesheet.findMany({
        where: { status: 'approved' },
        include: {
            employee: {
                include: {
                    assignments: {
                        include: { client: true },
                    },
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });

    // Group by client
    const clientMap = new Map<string, ClientGroup>();

    for (const ts of timesheets as TimesheetWithRelations[]) {
        const assignment = ts.employee.assignments[0];
        if (!assignment) continue;

        const clientId = assignment.client.id;
        const clientName = assignment.client.name;
        const regularHours = ts.regularHours.toNumber();
        const overtimeHours = ts.overtimeHours.toNumber();
        const billRate = assignment.billRate.toNumber();
        const payRate = assignment.payRate.toNumber();
        const totalHours = regularHours + overtimeHours;
        const billTotal = (regularHours * billRate) + (overtimeHours * billRate * 1.5);
        const payrollTotal = (regularHours * payRate) + (overtimeHours * payRate * 1.5);

        if (!clientMap.has(clientId)) {
            clientMap.set(clientId, {
                clientId,
                clientName,
                employees: [],
                totalBill: 0,
                totalPayroll: 0,
            });
        }

        const group = clientMap.get(clientId)!;

        // Find or create employee entry
        let empEntry = group.employees.find(e => e.employeeId === ts.employee.id);
        if (!empEntry) {
            empEntry = {
                employeeId: ts.employee.id,
                employeeName: ts.employee.name,
                totalHours: 0,
                overtimeHours: 0,
                billRate,
                payRate,
                billTotal: 0,
                payrollTotal: 0,
            };
            group.employees.push(empEntry);
        }

        empEntry.totalHours += totalHours;
        empEntry.overtimeHours += overtimeHours;
        empEntry.billTotal += billTotal;
        empEntry.payrollTotal += payrollTotal;
        group.totalBill += billTotal;
        group.totalPayroll += payrollTotal;
    }

    return Array.from(clientMap.values()).sort((a, b) => b.totalBill - a.totalBill);
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
}

export default async function BillingSummaryPage() {
    const groups = await getBillingSummary();

    const totals = groups.reduce((acc, g) => ({
        bill: acc.bill + g.totalBill,
        payroll: acc.payroll + g.totalPayroll,
    }), { bill: 0, payroll: 0 });

    return (
        <>
            <header className="page-header">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="page-title">Billing Summary</h1>
                        <p className="page-subtitle">View billing and payroll totals grouped by client</p>
                    </div>
                    <button className="btn btn-secondary">
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>
            </header>

            <div className="page-content">
                {/* Summary Stats */}
                <div className="stats-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="stat-card">
                        <div className="stat-icon blue">
                            <Users size={24} />
                        </div>
                        <div className="stat-value">{groups.length}</div>
                        <div className="stat-label">Active Clients</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green">
                            <DollarSign size={24} />
                        </div>
                        <div className="stat-value">{formatCurrency(totals.bill)}</div>
                        <div className="stat-label">Total Billable</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon orange">
                            <TrendingUp size={24} />
                        </div>
                        <div className="stat-value">{formatCurrency(totals.bill - totals.payroll)}</div>
                        <div className="stat-label">Total Margin</div>
                    </div>
                </div>

                {/* Client Groups */}
                {groups.map((group) => (
                    <div key={group.clientId} className="card client-billing-card" style={{ marginBottom: '24px' }}>
                        <div className="client-billing-header">
                            <h3 className="client-name">{group.clientName}</h3>
                            <div className="client-totals">
                                <span className="total-badge bill">Bill: {formatCurrency(group.totalBill)}</span>
                                <span className="total-badge payroll">Payroll: {formatCurrency(group.totalPayroll)}</span>
                                <span className="total-badge margin">Margin: {formatCurrency(group.totalBill - group.totalPayroll)}</span>
                            </div>
                        </div>
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Total Hours</th>
                                        <th>OT Hours</th>
                                        <th>Bill Rate</th>
                                        <th>Bill Total</th>
                                        <th>Payroll Total</th>
                                        <th>Margin</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.employees.map((emp) => (
                                        <tr key={emp.employeeId}>
                                            <td style={{ fontWeight: 500 }}>{emp.employeeName}</td>
                                            <td className="font-mono">{emp.totalHours.toFixed(1)}</td>
                                            <td className="font-mono text-muted">{emp.overtimeHours > 0 ? emp.overtimeHours.toFixed(1) : '-'}</td>
                                            <td className="font-mono">${emp.billRate}/hr</td>
                                            <td className="font-mono" style={{ color: 'var(--accent-green)' }}>
                                                {formatCurrency(emp.billTotal)}
                                            </td>
                                            <td className="font-mono" style={{ color: 'var(--accent-orange)' }}>
                                                {formatCurrency(emp.payrollTotal)}
                                            </td>
                                            <td className="font-mono" style={{ color: 'var(--accent-blue)' }}>
                                                {formatCurrency(emp.billTotal - emp.payrollTotal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="totals-row">
                                        <td colSpan={4}><strong>Client Total</strong></td>
                                        <td className="font-mono" style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
                                            {formatCurrency(group.totalBill)}
                                        </td>
                                        <td className="font-mono" style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>
                                            {formatCurrency(group.totalPayroll)}
                                        </td>
                                        <td className="font-mono" style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>
                                            {formatCurrency(group.totalBill - group.totalPayroll)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                ))}

                {groups.length === 0 && (
                    <div className="card">
                        <div className="empty-state">
                            <DollarSign size={48} />
                            <h3>No billing data yet</h3>
                            <p>Approve timesheets to see billing summaries grouped by client</p>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
