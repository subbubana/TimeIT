import { NextResponse } from 'next/server';
import { emailPoller } from '@/lib/emailPoller';

export async function POST() {
    try {
        await emailPoller.reload();

        return NextResponse.json({
            success: true,
            message: 'Email polling configuration reloaded',
            status: emailPoller.getStatus(),
        });
    } catch (error) {
        console.error('[API] Error reloading polling config:', error);
        return NextResponse.json(
            { error: 'Failed to reload configuration' },
            { status: 500 }
        );
    }
}
