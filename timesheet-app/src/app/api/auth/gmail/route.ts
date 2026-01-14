import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '@/lib/gmail';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const prompt = searchParams.get('prompt');

        // If prompt=select_account, force account selection
        const authUrl = getAuthUrl(prompt === 'select_account');
        return NextResponse.redirect(authUrl);
    } catch (error) {
        console.error('Error generating auth URL:', error);
        return NextResponse.json(
            { error: 'Failed to generate authentication URL' },
            { status: 500 }
        );
    }
}
