'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EmailCheckButtonProps {
    className?: string;
    variant?: 'primary' | 'secondary' | 'ghost';
    label?: string;
    showIcon?: boolean;
}

export default function EmailCheckButton({
    className = 'btn',
    variant = 'primary',
    label = 'Check Emails',
    showIcon = true
}: EmailCheckButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleCheck = async (e: React.MouseEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            console.log('[EmailCheckButton] Triggering email check...');
            const response = await fetch('/api/email/check', { method: 'POST' });
            const data = await response.json();

            if (response.status === 401 && data.authUrl) {
                console.warn('[EmailCheckButton] Authentication required');
                // Open auth URL in a different tab
                window.open(data.authUrl, '_blank');
                alert('Gmail not connected. A new tab has been opened to authenticate your account. Please log in there and then try clicking this button again.');
            } else if (data.success) {
                console.log('[EmailCheckButton] Success:', data);
                if (data.totalEmails === 0) {
                    alert('Check complete: No new attachments found in your inbox.');
                } else {
                    alert(`Success! Checked ${data.totalEmails} emails. \n- ${data.processed} timesheets created. \n- ${data.skipped} already processed.`);
                }
                router.refresh();
            } else {
                console.error('[EmailCheckButton] API Error:', data.error);
                let msg = data.error || 'Failed to check emails';
                if (msg.includes('Gmail API has not been used')) {
                    msg = "Gmail API is not enabled in your Google Cloud Project. Please check the terminal logs for the activation link or follow the instructions provided earlier.";
                }
                alert(msg);
            }
        } catch (error) {
            console.error('[EmailCheckButton] Network/Runtime Error:', error);
            alert('An error occurred while connecting to the server. Please check if the backend is running.');
        } finally {
            setIsLoading(false);
        }
    };

    const variantClass = variant === 'ghost' ? 'btn-ghost' : variant === 'secondary' ? 'btn-secondary' : 'btn-primary';

    return (
        <button
            type="button"
            className={`${className} ${variantClass}`}
            onClick={handleCheck}
            disabled={isLoading}
            style={variant === 'secondary' ? { width: '100%' } : {}}
        >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
            {isLoading ? 'Checking...' : label}
        </button>
    );
}
