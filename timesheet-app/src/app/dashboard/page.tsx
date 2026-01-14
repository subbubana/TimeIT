import {
  Clock,
  FileText,
  Users,
  Wallet,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

// Force dynamic rendering - prevents build from trying to connect to database
export const dynamic = 'force-dynamic';

async function getDashboardStats() {
  const [
    employeeCount,
    clientCount,
    pendingTimesheets,
    approvedTimesheets,
    pendingInvoices,
    pendingPayroll,
    recentTimesheets,
    recentInvoices,
  ] = await Promise.all([
    prisma.employee.count({ where: { status: 'active' } }),
    prisma.client.count(),
    prisma.timesheet.count({ where: { status: 'pending' } }),
    prisma.timesheet.count({ where: { status: 'approved' } }),
    prisma.invoice.count({ where: { status: { in: ['draft', 'sent'] } } }),
    prisma.payroll.count({ where: { status: 'pending' } }),
    prisma.timesheet.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { employee: true },
    }),
    prisma.invoice.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { client: true },
    }),
  ]);

  // Calculate totals
  const invoiceTotals = await prisma.invoice.aggregate({
    _sum: { amount: true },
    where: { status: 'paid' },
  });

  const payrollTotals = await prisma.payroll.aggregate({
    _sum: { grossPay: true },
    where: { status: 'processed' },
  });

  return {
    employeeCount,
    clientCount,
    pendingTimesheets,
    approvedTimesheets,
    pendingInvoices,
    pendingPayroll,
    recentTimesheets,
    recentInvoices,
    totalRevenue: invoiceTotals._sum.amount?.toNumber() || 0,
    totalPayroll: payrollTotals._sum.grossPay?.toNumber() || 0,
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
}

export default async function Dashboard() {
  const session = await auth();

  // Protect dashboard - redirect to landing if not logged in
  if (!session) {
    redirect('/');
  }

  const stats = await getDashboardStats();

  return (
    <>
      <header className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your timesheet automation system</p>
      </header>

      <div className="page-content">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon orange">
              <Clock size={24} />
            </div>
            <div className="stat-value">{stats.pendingTimesheets}</div>
            <div className="stat-label">Pending Timesheets</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <FileText size={24} />
            </div>
            <div className="stat-value">{stats.pendingInvoices}</div>
            <div className="stat-label">Pending Invoices</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">
              <Wallet size={24} />
            </div>
            <div className="stat-value">{stats.pendingPayroll}</div>
            <div className="stat-label">Pending Payroll</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <Users size={24} />
            </div>
            <div className="stat-value">{stats.employeeCount}</div>
            <div className="stat-label">Active Employees</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <TrendingUp size={24} />
            </div>
            <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
            <div className="stat-label">Total Revenue (Paid)</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon yellow">
              <Wallet size={24} />
            </div>
            <div className="stat-value">{formatCurrency(stats.totalPayroll)}</div>
            <div className="stat-label">Total Payroll (Processed)</div>
          </div>
        </div>

        {/* Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Recent Timesheets */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Timesheets</h3>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Period</th>
                    <th>Hours</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentTimesheets.map((ts) => (
                    <tr key={ts.id}>
                      <td>{ts.employee.name}</td>
                      <td className="text-sm text-muted">
                        {formatDate(ts.periodStart)} - {formatDate(ts.periodEnd)}
                      </td>
                      <td>
                        {ts.regularHours.toNumber()}
                        {ts.overtimeHours.toNumber() > 0 && (
                          <span className="text-muted"> +{ts.overtimeHours.toNumber()} OT</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${ts.status}`}>{ts.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Invoices */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Invoices</h3>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentInvoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="font-mono">{inv.invoiceNo}</td>
                      <td>{inv.client.name}</td>
                      <td>{formatCurrency(inv.amount.toNumber())}</td>
                      <td>
                        <span className={`badge ${inv.status}`}>{inv.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {stats.pendingTimesheets > 0 && (
          <div className="card mt-4" style={{ borderColor: 'var(--accent-orange)' }}>
            <div className="flex items-center gap-3">
              <AlertCircle size={24} style={{ color: 'var(--accent-orange)' }} />
              <div>
                <strong>{stats.pendingTimesheets} timesheet(s)</strong> pending approval.
                <span className="text-muted"> Review and approve to generate invoices.</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
