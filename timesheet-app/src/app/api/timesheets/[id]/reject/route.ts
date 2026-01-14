import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Reject a timesheet
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const timesheet = await prisma.timesheet.findUnique({
            where: { id },
        });

        if (!timesheet) {
            return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
        }

        if (timesheet.status !== 'pending') {
            return NextResponse.json({ error: 'Timesheet is not pending' }, { status: 400 });
        }

        await prisma.timesheet.update({
            where: { id },
            data: { status: 'rejected' },
        });

        return NextResponse.redirect(new URL('/timesheets', request.url));
    } catch (error) {
        console.error('Error rejecting timesheet:', error);
        return NextResponse.json({ error: 'Failed to reject timesheet' }, { status: 500 });
    }
}
