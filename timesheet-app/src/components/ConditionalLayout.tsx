'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLandingPage = pathname === '/';

    // Landing page has no sidebar/header
    if (isLandingPage) {
        return (
            <div className="landing-layout">
                <header className="landing-header">
                    <div className="landing-header-content">
                        <div className="landing-logo">
                            <div className="sidebar-logo-icon">TS</div>
                            <span>TimeSheet Pro</span>
                        </div>
                        <a href="/api/auth/signin" className="btn btn-primary">
                            Sign In
                        </a>
                    </div>
                </header>
                <main className="landing-main">
                    {children}
                </main>
                <footer className="landing-footer">
                    <p>© 2026 TimeSheet Pro. Built with AI.</p>
                </footer>
            </div>
        );
    }

    // Regular pages with sidebar and header
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-wrapper">
                <Header />
                <main className="main-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
