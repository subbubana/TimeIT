import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Process payroll
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const payroll = await prisma.payroll.findUnique({
            where: { id },
        });

        if (!payroll) {
            return NextResponse.json({ error: 'Payroll not found' }, { status: 404 });
        }

        if (payroll.status !== 'pending') {
            return NextResponse.json({ error: 'Payroll is not pending' }, { status: 400 });
        }

        // Simulate payroll processing
        await prisma.payroll.update({
            where: { id },
            data: {
                status: 'processed',
                processedAt: new Date(),
            },
        });

        return NextResponse.redirect(new URL('/payroll', request.url));
    } catch (error) {
        console.error('Error processing payroll:', error);
        return NextResponse.json({ error: 'Failed to process payroll' }, { status: 500 });
    }
}
