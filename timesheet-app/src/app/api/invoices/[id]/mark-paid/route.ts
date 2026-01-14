import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Mark invoice as paid
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

        if (invoice.status !== 'sent') {
            return NextResponse.json({ error: 'Invoice must be sent before marking as paid' }, { status: 400 });
        }

        await prisma.invoice.update({
            where: { id },
            data: {
                status: 'paid',
                paidAt: new Date(),
            },
        });

        return NextResponse.redirect(new URL('/invoices', request.url));
    } catch (error) {
        console.error('Error marking invoice as paid:', error);
        return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }
}
