import { NextResponse } from 'next/server';
import { emailPoller } from '@/lib/emailPoller';

export async function GET() {
    try {
        const status = emailPoller.getStatus();

        return NextResponse.json({
            success: true,
            ...status,
        });
    } catch (error) {
        console.error('[API] Error getting polling status:', error);
        return NextResponse.json(
            { error: 'Failed to get polling status' },
            { status: 500 }
        );
    }
}
