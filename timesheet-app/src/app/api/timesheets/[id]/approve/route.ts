import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Approve a timesheet
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get the timesheet with employee assignment
        const timesheet = await prisma.timesheet.findUnique({
            where: { id },
            include: {
                employee: {
                    include: {
                        assignments: {
                            where: { endDate: null },
                            include: { client: true },
                        },
                    },
                },
            },
        });

        if (!timesheet) {
            return NextResponse.json({ error: 'Timesheet not found' }, { status: 404 });
        }

        if (timesheet.status !== 'pending') {
            return NextResponse.json({ error: 'Timesheet is not pending' }, { status: 400 });
        }

        const assignment = timesheet.employee.assignments[0];
        if (!assignment) {
            return NextResponse.json({ error: 'No active assignment found' }, { status: 400 });
        }

        // Calculate amounts
        const regularHours = timesheet.regularHours.toNumber();
        const overtimeHours = timesheet.overtimeHours.toNumber();
        const billRate = assignment.billRate.toNumber();
        const payRate = assignment.payRate.toNumber();
        const overtimeMultiplier = 1.5;
        const taxRate = 0.25;

        const invoiceAmount = (regularHours * billRate) + (overtimeHours * billRate * overtimeMultiplier);
        const grossPay = (regularHours * payRate) + (overtimeHours * payRate * overtimeMultiplier);
        const taxes = grossPay * taxRate;
        const netPay = grossPay - taxes;

        // Generate invoice number
        const lastInvoice = await prisma.invoice.findFirst({
            orderBy: { invoiceNo: 'desc' },
        });
        const nextNum = lastInvoice
            ? parseInt(lastInvoice.invoiceNo.split('-')[2]) + 1
            : 1;
        const invoiceNo = `INV-2026-${String(nextNum).padStart(3, '0')}`;

        // Update timesheet and create invoice + payroll in a transaction
        await prisma.$transaction([
            prisma.timesheet.update({
                where: { id },
                data: {
                    status: 'approved',
                    approvedAt: new Date(),
                },
            }),
            prisma.invoice.create({
                data: {
                    clientId: assignment.clientId,
                    timesheetId: id,
                    invoiceNo,
                    amount: invoiceAmount,
                    status: 'draft',
                    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                },
            }),
            prisma.payroll.create({
                data: {
                    employeeId: timesheet.employeeId,
                    timesheetId: id,
                    grossPay: grossPay,
                    netPay: netPay,
                    taxes: taxes,
                    status: 'pending',
                },
            }),
        ]);

        // Redirect back to timesheets page
        return NextResponse.redirect(new URL('/timesheets', request.url));
    } catch (error) {
        console.error('Error approving timesheet:', error);
        return NextResponse.json({ error: 'Failed to approve timesheet' }, { status: 500 });
    }
}
