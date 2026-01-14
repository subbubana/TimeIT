'use client';

import AuthButton from './AuthButton';

export default function Header() {
    return (
        <header className="app-header">
            <div className="header-content">
                <div className="header-title">
                    <h1>TimeSheet Pro</h1>
                </div>
                <div className="header-actions">
                    <AuthButton />
                </div>
            </div>
        </header>
    );
}
