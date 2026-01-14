'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Mail, RefreshCw, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

interface EmailConfig {
    monitoredEmail: string | null;
    isConnected: boolean;
    lastChecked: string | null;
}

export default function EmailSetupPage() {
    const { data: session, status } = useSession();
    const [emailConfig, setEmailConfig] = useState<EmailConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [choice, setChoice] = useState<'login' | 'different'>('login');

    useEffect(() => {
        fetchEmailConfig();
    }, []);

    async function fetchEmailConfig() {
        try {
            const res = await fetch('/api/email/config');
            const data = await res.json();
            setEmailConfig(data);
        } catch (error) {
            console.error('Failed to fetch email config:', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleSetupEmail() {
        setConnecting(true);
        try {
            if (choice === 'login' && session?.user?.email) {
                // Use the logged-in user's email
                await fetch('/api/email/config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: session.user.email,
                        useLoginToken: true
                    }),
                });
                await fetchEmailConfig();
            } else {
                // Redirect to Gmail OAuth for a different account
                window.location.href = '/api/auth/gmail?prompt=select_account';
            }
        } catch (error) {
            console.error('Failed to set up email:', error);
        } finally {
            setConnecting(false);
        }
    }

    async function handleDisconnect() {
        if (!confirm('Are you sure you want to disconnect email monitoring?')) return;

        try {
            await fetch('/api/email/config', { method: 'DELETE' });
            await fetchEmailConfig();
        } catch (error) {
            console.error('Failed to disconnect:', error);
        }
    }

    if (status === 'loading' || loading) {
        return (
            <div className="page-content">
                <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
                    <div className="spinner" style={{ margin: '0 auto' }} />
                    <p className="text-muted" style={{ marginTop: '16px' }}>Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <>
                <header className="page-header">
                    <h1 className="page-title">Email Setup</h1>
                    <p className="page-subtitle">Configure which inbox to monitor for timesheets</p>
                </header>
                <div className="page-content">
                    <div className="card">
                        <div className="empty-state">
                            <Mail size={48} />
                            <h3>Sign in Required</h3>
                            <p>Please sign in with Google to set up email monitoring</p>
                        </div>
                    </div>
                </div>
            </>
        );
    }

    // Already configured
    if (emailConfig?.isConnected && emailConfig.monitoredEmail) {
        return (
            <>
                <header className="page-header">
                    <h1 className="page-title">Email Setup</h1>
                    <p className="page-subtitle">Configure which inbox to monitor for timesheets</p>
                </header>
                <div className="page-content">
                    <div className="card email-config-card">
                        <div className="config-status connected">
                            <CheckCircle size={48} />
                            <h3>Email Monitoring Active</h3>
                            <p className="monitored-email">{emailConfig.monitoredEmail}</p>
                            {emailConfig.lastChecked && (
                                <p className="text-muted text-sm">
                                    Last checked: {new Date(emailConfig.lastChecked).toLocaleString()}
                                </p>
                            )}
                        </div>

                        <div className="config-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => fetch('/api/email/check', { method: 'POST' })}
                            >
                                <RefreshCw size={18} />
                                Check Emails Now
                            </button>
                            <button
                                className="btn btn-ghost"
                                onClick={handleDisconnect}
                            >
                                Disconnect
                            </button>
                        </div>
                    </div>

                    <div className="card" style={{ marginTop: '24px' }}>
                        <h4 style={{ marginBottom: '16px' }}>Want to monitor a different email?</h4>
                        <p className="text-muted" style={{ marginBottom: '16px' }}>
                            You can disconnect and connect a different Gmail account for monitoring.
                        </p>
                        <button
                            className="btn btn-secondary"
                            onClick={handleDisconnect}
                        >
                            <ExternalLink size={18} />
                            Switch Email Account
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // Setup flow
    return (
        <>
            <header className="page-header">
                <h1 className="page-title">Email Setup</h1>
                <p className="page-subtitle">Configure which inbox to monitor for timesheets</p>
            </header>
            <div className="page-content">
                <div className="card email-setup-card">
                    <div className="setup-header">
                        <Mail size={48} style={{ color: 'var(--accent-orange)' }} />
                        <h3>Set Up Email Monitoring</h3>
                        <p className="text-muted">
                            We'll scan your inbox for timesheet attachments and automatically process them.
                        </p>
                    </div>

                    <div className="setup-info">
                        <p>
                            You're logged in as: <strong>{session.user?.email}</strong>
                        </p>
                    </div>

                    <div className="setup-options">
                        <h4>Which inbox should we monitor?</h4>

                        <label className={`option-card ${choice === 'login' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="emailChoice"
                                value="login"
                                checked={choice === 'login'}
                                onChange={() => setChoice('login')}
                            />
                            <div className="option-content">
                                <span className="option-title">Use my login email</span>
                                <span className="option-email">{session.user?.email}</span>
                            </div>
                        </label>

                        <label className={`option-card ${choice === 'different' ? 'selected' : ''}`}>
                            <input
                                type="radio"
                                name="emailChoice"
                                value="different"
                                checked={choice === 'different'}
                                onChange={() => setChoice('different')}
                            />
                            <div className="option-content">
                                <span className="option-title">Connect a different Gmail account</span>
                                <span className="option-desc">Sign in to another Google account</span>
                            </div>
                        </label>
                    </div>

                    <div className="setup-actions">
                        <button
                            className="btn btn-primary"
                            onClick={handleSetupEmail}
                            disabled={connecting}
                        >
                            {connecting ? (
                                <>
                                    <div className="spinner" style={{ width: '18px', height: '18px' }} />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <CheckCircle size={18} />
                                    Continue
                                </>
                            )}
                        </button>
                    </div>

                    <div className="setup-note">
                        <AlertCircle size={16} />
                        <span>We only read emails with PDF or image attachments. Your data stays private.</span>
                    </div>
                </div>
            </div>
        </>
    );
}
