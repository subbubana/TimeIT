import { NextResponse } from 'next/server';
import { emailPoller } from '@/lib/emailPoller';

export async function POST() {
    try {
        emailPoller.stop();

        return NextResponse.json({
            success: true,
            message: 'Email polling stopped',
            status: emailPoller.getStatus(),
        });
    } catch (error) {
        console.error('[API] Error stopping polling:', error);
        return NextResponse.json(
            { error: 'Failed to stop polling' },
            { status: 500 }
        );
    }
}
