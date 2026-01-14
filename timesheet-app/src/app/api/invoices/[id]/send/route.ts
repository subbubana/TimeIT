import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Mark invoice as sent
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
        });

        if (!invoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
        }

        if (invoice.status !== 'draft') {
            return NextResponse.json({ error: 'Invoice is not in draft status' }, { status: 400 });
        }

        await prisma.invoice.update({
            where: { id },
            data: { status: 'sent' },
        });

        return NextResponse.redirect(new URL('/invoices', request.url));
    } catch (error) {
        console.error('Error sending invoice:', error);
        return NextResponse.json({ error: 'Failed to send invoice' }, { status: 500 });
    }
}
