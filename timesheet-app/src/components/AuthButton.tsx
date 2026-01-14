'use client';

import { signIn, signOut, useSession } from "next-auth/react";
import { LogIn, LogOut, User } from "lucide-react";

export default function AuthButton() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className="auth-button loading">
                <div className="skeleton" style={{ width: 120, height: 36 }} />
            </div>
        );
    }

    if (session?.user) {
        return (
            <div className="auth-user">
                {session.user.image ? (
                    <img
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="auth-avatar"
                    />
                ) : (
                    <div className="auth-avatar-placeholder">
                        <User size={20} />
                    </div>
                )}
                <div className="auth-info">
                    <span className="auth-name">{session.user.name}</span>
                    <span className="auth-email">{session.user.email}</span>
                </div>
                <button
                    onClick={() => signOut()}
                    className="btn btn-ghost btn-icon"
                    title="Sign Out"
                >
                    <LogOut size={18} />
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={() => signIn("google")}
            className="btn btn-primary"
        >
            <LogIn size={18} />
            Sign in with Google
        </button>
    );
}
