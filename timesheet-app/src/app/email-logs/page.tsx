import { RefreshCw, Check, X, AlertCircle, Paperclip } from 'lucide-react';
import prisma from '@/lib/prisma';
import RawDataViewer from '@/components/RawDataViewer';

import EmailCheckButton from '@/components/EmailCheckButton';
import EmailPollingStatus from '@/components/EmailPollingStatus';

export const dynamic = 'force-dynamic';

async function getEmailLogs() {
    return prisma.emailLog.findMany({
        orderBy: { receivedAt: 'desc' },
        take: 100,
    });
}

function formatDateTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

export default async function EmailLogsPage() {
    const logs = await getEmailLogs() as any[];

    const stats = {
        total: logs.length,
        processed: logs.filter(l => l.processed).length,
        failed: logs.filter(l => l.error).length,
    };

    return (
        <>
            <header className="page-header">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="page-title">Email Logs & Verification</h1>
                        <p className="page-subtitle">Monitor incoming emails and Gemini extraction results</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <EmailPollingStatus />
                        <EmailCheckButton label="Check Now" />
                    </div>
                </div>
            </header>

            <div className="page-content">
                {/* Stats */}
                <div className="stats-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                    <div className="stat-card">
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Emails</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--accent-green)' }}>{stats.processed}</div>
                        <div className="stat-label">Processed</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value" style={{ color: 'var(--accent-red)' }}>{stats.failed}</div>
                        <div className="stat-label">Errors</div>
                    </div>
                </div>

                <div className="card">
                    {logs.length === 0 ? (
                        <div className="empty-state">
                            <AlertCircle size={48} />
                            <h3>No emails processed yet</h3>
                            <p>Click &quot;Check Now&quot; to scan for new timesheet emails</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Received</th>
                                        <th>From</th>
                                        <th>Subject</th>
                                        <th>Attachments</th>
                                        <th>Status</th>
                                        <th>Extracted Data</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="text-xs">{formatDateTime(log.receivedAt)}</td>
                                            <td className="text-xs">{log.fromAddress}</td>
                                            <td className="text-sm" style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {log.subject}
                                            </td>
                                            <td>
                                                {log.attachmentCount > 0 ? (
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Paperclip size={14} />
                                                        <span>{log.attachmentCount}</span>
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td>
                                                {log.processed ? (
                                                    <span className="badge approved">
                                                        Processed
                                                    </span>
                                                ) : log.error ? (
                                                    <span className="badge rejected" title={log.error}>
                                                        Error
                                                    </span>
                                                ) : (
                                                    <span className="badge pending">Pending</span>
                                                )}
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    {log.attachments && (log.attachments as any[]).map((att, idx) => (
                                                        <RawDataViewer
                                                            key={idx}
                                                            data={att.extraction}
                                                            label={`Extraction: ${att.filename}`}
                                                        />
                                                    ))}
                                                    {!log.attachments && '-'}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
