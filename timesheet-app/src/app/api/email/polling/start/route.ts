import { NextResponse } from 'next/server';
import { emailPoller } from '@/lib/emailPoller';

export async function POST() {
    try {
        await emailPoller.start();

        return NextResponse.json({
            success: true,
            message: 'Email polling started',
            status: emailPoller.getStatus(),
        });
    } catch (error) {
        console.error('[API] Error starting polling:', error);
        return NextResponse.json(
            { error: 'Failed to start polling' },
            { status: 500 }
        );
    }
}
