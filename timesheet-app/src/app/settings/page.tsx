import { Save } from 'lucide-react';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getSettings() {
    const settings = await prisma.settings.findMany({
        orderBy: { key: 'asc' },
    });
    return settings.reduce((acc: Record<string, string>, s: { key: string; value: string }) => {
        acc[s.key] = s.value;
        return acc;
    }, {} as Record<string, string>);
}

export default async function SettingsPage() {
    const settings = await getSettings();

    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Settings</h1>
                <p className="page-subtitle">Configure your timesheet automation system</p>
            </header>

            <div className="page-content">
                <form action="/api/settings" method="POST">
                    {/* Company Info */}
                    <div className="card mb-6">
                        <h3 className="card-title" style={{ marginBottom: '20px' }}>Company Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Company Name</label>
                                <input
                                    type="text"
                                    name="company_name"
                                    className="form-input"
                                    defaultValue={settings.company_name || ''}
                                    placeholder="Your Company Name"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Company Email</label>
                                <input
                                    type="email"
                                    name="company_email"
                                    className="form-input"
                                    defaultValue={settings.company_email || ''}
                                    placeholder="admin@company.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Billing Settings */}
                    <div className="card mb-6">
                        <h3 className="card-title" style={{ marginBottom: '20px' }}>Billing & Payroll</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Overtime Multiplier</label>
                                <input
                                    type="number"
                                    name="overtime_multiplier"
                                    className="form-input"
                                    defaultValue={settings.overtime_multiplier || '1.5'}
                                    step="0.1"
                                    min="1"
                                    max="3"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Tax Rate (%)</label>
                                <input
                                    type="number"
                                    name="tax_rate"
                                    className="form-input"
                                    defaultValue={(parseFloat(settings.tax_rate || '0.25') * 100).toString()}
                                    step="0.5"
                                    min="0"
                                    max="50"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Invoice Due (Days)</label>
                                <input
                                    type="number"
                                    name="invoice_due_days"
                                    className="form-input"
                                    defaultValue={settings.invoice_due_days || '30'}
                                    min="1"
                                    max="90"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email Settings */}
                    <div className="card mb-6">
                        <h3 className="card-title" style={{ marginBottom: '20px' }}>Email Monitoring</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Check Interval (Minutes)</label>
                                <input
                                    type="number"
                                    name="email_check_interval_minutes"
                                    className="form-input"
                                    defaultValue={settings.email_check_interval_minutes || '5'}
                                    min="1"
                                    max="60"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Gmail Address</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value="subbareddybana123@gmail.com"
                                    disabled
                                    style={{ opacity: 0.6 }}
                                />
                                <small className="text-muted">Configured via environment variable</small>
                            </div>
                        </div>
                    </div>

                    {/* API Keys Info */}
                    <div className="card mb-6" style={{ borderColor: 'var(--accent-orange)' }}>
                        <h3 className="card-title" style={{ marginBottom: '20px' }}>API Configuration</h3>
                        <p className="text-muted" style={{ marginBottom: '16px' }}>
                            API keys are configured via environment variables for security. Update your <code>.env</code> file to change these settings.
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label className="form-label">Gemini API</label>
                                <div className="flex items-center gap-2">
                                    <span className={`badge ${process.env.GEMINI_API_KEY ? 'approved' : 'rejected'}`}>
                                        {process.env.GEMINI_API_KEY ? 'Configured' : 'Not Set'}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Google OAuth</label>
                                <div className="flex items-center gap-2">
                                    <span className={`badge ${process.env.GOOGLE_CLIENT_ID ? 'approved' : 'rejected'}`}>
                                        {process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Not Set'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary">
                        <Save size={18} />
                        Save Settings
                    </button>
                </form>
            </div>
        </>
    );
}
