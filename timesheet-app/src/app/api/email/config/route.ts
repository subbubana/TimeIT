import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Get current email config
export async function GET() {
    try {
        const session = await auth();

        // Check if email monitoring is configured
        const emailConfig = await prisma.settings.findUnique({
            where: { key: 'monitored_email' },
        });

        const lastChecked = await prisma.settings.findUnique({
            where: { key: 'last_email_check' },
        });

        const hasTokens = await prisma.settings.findUnique({
            where: { key: 'gmail_tokens' },
        });

        return NextResponse.json({
            monitoredEmail: emailConfig?.value || null,
            isConnected: !!hasTokens,
            lastChecked: lastChecked?.value || null,
            loggedInAs: session?.user?.email || null,
        });
    } catch (error) {
        console.error('Error fetching email config:', error);
        return NextResponse.json(
            { error: 'Failed to fetch email config' },
            { status: 500 }
        );
    }
}

// Set up email monitoring
export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'Not authenticated' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { email, useLoginToken } = body;

        // Store the monitored email
        await prisma.settings.upsert({
            where: { key: 'monitored_email' },
            update: { value: email },
            create: { key: 'monitored_email', value: email },
        });

        // If using login token, mark that we should use session token
        if (useLoginToken) {
            await prisma.settings.upsert({
                where: { key: 'use_session_token' },
                update: { value: 'true' },
                create: { key: 'use_session_token', value: 'true' },
            });

            // Mark as connected (we'll use the session access token)
            await prisma.settings.upsert({
                where: { key: 'gmail_tokens' },
                update: { value: JSON.stringify({ type: 'session' }) },
                create: { key: 'gmail_tokens', value: JSON.stringify({ type: 'session' }) },
            });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error setting up email:', error);
        return NextResponse.json(
            { error: 'Failed to set up email' },
            { status: 500 }
        );
    }
}

// Disconnect email monitoring
export async function DELETE() {
    try {
        await prisma.settings.deleteMany({
            where: {
                key: { in: ['monitored_email', 'gmail_tokens', 'use_session_token'] },
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error disconnecting email:', error);
        return NextResponse.json(
            { error: 'Failed to disconnect' },
            { status: 500 }
        );
    }
}
