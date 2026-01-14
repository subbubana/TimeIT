'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Building2,
    Clock,
    FileText,
    Wallet,
    Settings,
    Mail,
    RefreshCw,
} from 'lucide-react';

import EmailCheckButton from './EmailCheckButton';

const navItems = [
    {
        section: 'Overview',
        items: [
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ],
    },
    {
        section: 'Management',
        items: [
            { href: '/employees', label: 'Employees', icon: Users },
            { href: '/clients', label: 'Clients', icon: Building2 },
        ],
    },
    {
        section: 'Processing',
        items: [
            { href: '/timesheets', label: 'Timesheets', icon: Clock },
            { href: '/billing', label: 'Billing Summary', icon: FileText },
            { href: '/payroll', label: 'Payroll', icon: Wallet },
        ],
    },
    {
        section: 'System',
        items: [
            { href: '/email-setup', label: 'Email Setup', icon: Mail },
            { href: '/email-logs', label: 'Email Logs', icon: Mail },
            { href: '/settings', label: 'Settings', icon: Settings },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">TS</div>
                    <span className="sidebar-logo-text">TimeSheet Pro</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((section) => (
                    <div key={section.section} className="nav-section">
                        <div className="nav-section-title">{section.section}</div>
                        {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`nav-item ${isActive ? 'active' : ''}`}
                                >
                                    <Icon size={20} />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border-color)' }}>
                <EmailCheckButton variant="secondary" />
            </div>
        </aside>
    );
}
