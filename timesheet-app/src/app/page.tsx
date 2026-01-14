import Link from 'next/link';
import { ArrowRight, Clock, FileText, Zap, Shield, BarChart3 } from 'lucide-react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function LandingPage() {
    const session = await auth();

    // If logged in, redirect to dashboard
    if (session) {
        redirect('/dashboard');
    }

    return (
        <div className="landing-page">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <div className="hero-badge">
                        <Zap size={14} />
                        <span>AI-Powered Automation</span>
                    </div>
                    <h1 className="hero-title">
                        Timesheet Processing
                        <br />
                        <span className="gradient-text">Made Effortless</span>
                    </h1>
                    <p className="hero-subtitle">
                        Automatically extract timesheet data from emails, generate invoices,
                        and process payroll — all powered by AI.
                    </p>
                    <div className="hero-actions">
                        <Link href="/api/auth/signin" className="btn btn-primary btn-lg">
                            Sign In with Google
                            <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="hero-card">
                        <div className="hero-card-header">
                            <Clock size={20} />
                            <span>Timesheet Processed</span>
                        </div>
                        <div className="hero-card-body">
                            <div className="stat-row">
                                <span>Employee</span>
                                <span className="stat-value">John Doe</span>
                            </div>
                            <div className="stat-row">
                                <span>Hours</span>
                                <span className="stat-value">40 hrs</span>
                            </div>
                            <div className="stat-row">
                                <span>Status</span>
                                <span className="badge approved">Approved</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <h2 className="section-title">How It Works</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <FileText size={28} />
                        </div>
                        <h3>Email Monitoring</h3>
                        <p>Automatically scan your inbox for timesheet attachments from employees.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Zap size={28} />
                        </div>
                        <h3>AI Extraction</h3>
                        <p>Gemini AI extracts employee names, hours, and dates from any format.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <BarChart3 size={28} />
                        </div>
                        <h3>Billing Summary</h3>
                        <p>View billing and payroll grouped by client with automatic calculations.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <Shield size={28} />
                        </div>
                        <h3>Admin Approval</h3>
                        <p>Review extracted data before approving invoices and payroll runs.</p>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <h2>Ready to automate your timesheets?</h2>
                <p>Sign in with Google to connect your email and start processing.</p>
                <Link href="/api/auth/signin" className="btn btn-primary btn-lg">
                    Get Started Now
                </Link>
            </section>
        </div>
    );
}
