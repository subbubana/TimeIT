import { NextRequest, NextResponse } from 'next/server';
import { handleAuthCallback } from '@/lib/gmail';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const code = searchParams.get('code');
        const error = searchParams.get('error');

        if (error) {
            console.error('Gmail OAuth error:', error);
            return NextResponse.redirect(new URL('/email-setup?error=oauth_denied', request.url));
        }

        if (!code) {
            return NextResponse.redirect(new URL('/email-setup?error=no_code', request.url));
        }

        // Exchange code for tokens (this now handles DB persistence)
        await handleAuthCallback(code);


        // Mark email as connected
        await prisma.settings.upsert({
            where: { key: 'gmail_connected' },
            update: { value: 'true' },
            create: { key: 'gmail_connected', value: 'true' },
        });

        return NextResponse.redirect(new URL('/email-setup?success=connected', request.url));
    } catch (error) {
        console.error('Gmail callback error:', error);
        return NextResponse.redirect(new URL('/email-setup?error=auth_failed', request.url));
    }
}
