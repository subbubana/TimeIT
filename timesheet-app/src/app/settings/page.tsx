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

                    {/* Email Polling Configuration */}
                    <div className="card mb-6">
                        <h3 className="card-title" style={{ marginBottom: '20px' }}>Email Polling Configuration</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Timezone</label>
                                <select
                                    name="email_polling_timezone"
                                    className="form-input"
                                    defaultValue={settings.email_polling_timezone || 'America/Chicago'}
                                >
                                    <option value="America/New_York">Eastern Time (ET)</option>
                                    <option value="America/Chicago">Central Time (CT)</option>
                                    <option value="America/Denver">Mountain Time (MT)</option>
                                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                    <option value="America/Phoenix">Arizona (MST)</option>
                                    <option value="America/Anchorage">Alaska Time (AKT)</option>
                                    <option value="Pacific/Honolulu">Hawaii Time (HST)</option>
                                    <option value="UTC">UTC</option>
                                </select>
                                <small className="text-muted">Timezone for business hours calculation</small>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Check Interval (Minutes)</label>
                                <input
                                    type="number"
                                    name="email_polling_interval"
                                    className="form-input"
                                    defaultValue={settings.email_polling_interval || '60'}
                                    min="5"
                                    max="120"
                                />
                                <small className="text-muted">How often to check for new emails</small>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                            <div className="form-group">
                                <label className="form-label">Business Hours Start</label>
                                <select
                                    name="email_polling_start_hour"
                                    className="form-input"
                                    defaultValue={settings.email_polling_start_hour || '9'}
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>
                                            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Business Hours End</label>
                                <select
                                    name="email_polling_end_hour"
                                    className="form-input"
                                    defaultValue={settings.email_polling_end_hour || '17'}
                                >
                                    {Array.from({ length: 24 }, (_, i) => (
                                        <option key={i} value={i}>
                                            {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Weekdays Only</label>
                                <select
                                    name="email_polling_weekdays_only"
                                    className="form-input"
                                    defaultValue={settings.email_polling_weekdays_only || 'true'}
                                >
                                    <option value="true">Yes (Mon-Fri)</option>
                                    <option value="false">No (All Days)</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group" style={{ marginTop: '20px' }}>
                            <label className="form-label">Enable Automatic Polling</label>
                            <select
                                name="email_polling_enabled"
                                className="form-input"
                                defaultValue={settings.email_polling_enabled || 'true'}
                            >
                                <option value="true">Enabled</option>
                                <option value="false">Disabled</option>
                            </select>
                            <small className="text-muted">When enabled, emails will be checked automatically during business hours</small>
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
