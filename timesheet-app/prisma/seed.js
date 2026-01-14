// Prisma 7 seed script - uses CommonJS
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();

    console.log('🌱 Starting seed...');

    // Clear existing data
    await prisma.emailLog.deleteMany();
    await prisma.payroll.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.timesheet.deleteMany();
    await prisma.employeeAssignment.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.client.deleteMany();
    await prisma.settings.deleteMany();

    console.log('✨ Cleared existing data');

    // Create Clients
    const clients = await Promise.all([
        prisma.client.create({
            data: {
                name: 'Bank of America',
                email: 'ap@bofa.com',
                address: '100 N Tryon St, Charlotte, NC 28255',
            },
        }),
        prisma.client.create({
            data: {
                name: 'Wells Fargo',
                email: 'accounts@wellsfargo.com',
                address: '420 Montgomery St, San Francisco, CA 94104',
            },
        }),
        prisma.client.create({
            data: {
                name: 'JPMorgan Chase',
                email: 'vendor@jpmorgan.com',
                address: '383 Madison Ave, New York, NY 10179',
            },
        }),
    ]);

    console.log(`✅ Created ${clients.length} clients`);

    // Create Employees
    const employees = await Promise.all([
        prisma.employee.create({
            data: {
                name: 'John Doe',
                email: 'john.doe@alphatech.com',
                phone: '+1-555-0101',
                status: 'active',
            },
        }),
        prisma.employee.create({
            data: {
                name: 'Jane Smith',
                email: 'jane.smith@alphatech.com',
                phone: '+1-555-0102',
                status: 'active',
            },
        }),
        prisma.employee.create({
            data: {
                name: 'Bob Wilson',
                email: 'bob.wilson@alphatech.com',
                phone: '+1-555-0103',
                status: 'active',
            },
        }),
        prisma.employee.create({
            data: {
                name: 'Alice Brown',
                email: 'alice.brown@alphatech.com',
                phone: '+1-555-0104',
                status: 'active',
            },
        }),
    ]);

    console.log(`✅ Created ${employees.length} employees`);

    // Create Employee Assignments
    const assignments = await Promise.all([
        prisma.employeeAssignment.create({
            data: {
                employeeId: employees[0].id,
                clientId: clients[0].id,
                billRate: 75.0,
                payRate: 50.0,
                startDate: new Date('2024-01-01'),
            },
        }),
        prisma.employeeAssignment.create({
            data: {
                employeeId: employees[1].id,
                clientId: clients[0].id,
                billRate: 95.0,
                payRate: 65.0,
                startDate: new Date('2024-02-01'),
            },
        }),
        prisma.employeeAssignment.create({
            data: {
                employeeId: employees[2].id,
                clientId: clients[1].id,
                billRate: 85.0,
                payRate: 55.0,
                startDate: new Date('2024-01-15'),
            },
        }),
        prisma.employeeAssignment.create({
            data: {
                employeeId: employees[3].id,
                clientId: clients[2].id,
                billRate: 90.0,
                payRate: 60.0,
                startDate: new Date('2024-03-01'),
            },
        }),
    ]);

    console.log(`✅ Created ${assignments.length} employee assignments`);

    // Create Timesheets
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const timesheets = await Promise.all([
        prisma.timesheet.create({
            data: {
                employeeId: employees[0].id,
                periodStart: twoWeeksAgo,
                periodEnd: oneWeekAgo,
                regularHours: 40,
                overtimeHours: 5,
                status: 'approved',
                sourceType: 'email',
                approvedAt: oneWeekAgo,
            },
        }),
        prisma.timesheet.create({
            data: {
                employeeId: employees[0].id,
                periodStart: oneWeekAgo,
                periodEnd: now,
                regularHours: 38,
                overtimeHours: 2,
                status: 'pending',
                sourceType: 'upload',
            },
        }),
        prisma.timesheet.create({
            data: {
                employeeId: employees[1].id,
                periodStart: twoWeeksAgo,
                periodEnd: oneWeekAgo,
                regularHours: 40,
                overtimeHours: 0,
                status: 'approved',
                sourceType: 'email',
                approvedAt: oneWeekAgo,
            },
        }),
        prisma.timesheet.create({
            data: {
                employeeId: employees[2].id,
                periodStart: oneWeekAgo,
                periodEnd: now,
                regularHours: 40,
                overtimeHours: 8,
                status: 'pending',
                sourceType: 'manual',
            },
        }),
    ]);

    console.log(`✅ Created ${timesheets.length} timesheets`);

    // Create Invoices
    const invoices = await Promise.all([
        prisma.invoice.create({
            data: {
                clientId: clients[0].id,
                timesheetId: timesheets[0].id,
                invoiceNo: 'INV-2026-001',
                amount: 3562.5,
                status: 'paid',
                dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                paidAt: oneWeekAgo,
            },
        }),
        prisma.invoice.create({
            data: {
                clientId: clients[0].id,
                timesheetId: timesheets[2].id,
                invoiceNo: 'INV-2026-002',
                amount: 3800,
                status: 'sent',
                dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            },
        }),
    ]);

    console.log(`✅ Created ${invoices.length} invoices`);

    // Create Payroll records
    const payrolls = await Promise.all([
        prisma.payroll.create({
            data: {
                employeeId: employees[0].id,
                timesheetId: timesheets[0].id,
                grossPay: 2375,
                netPay: 1781.25,
                taxes: 593.75,
                status: 'processed',
                processedAt: oneWeekAgo,
            },
        }),
        prisma.payroll.create({
            data: {
                employeeId: employees[1].id,
                timesheetId: timesheets[2].id,
                grossPay: 2600,
                netPay: 1950,
                taxes: 650,
                status: 'pending',
            },
        }),
    ]);

    console.log(`✅ Created ${payrolls.length} payroll records`);

    // Create Settings
    await prisma.settings.createMany({
        data: [
            { key: 'company_name', value: 'Alpha Tech Consulting' },
            { key: 'company_email', value: 'admin@alphatech.com' },
            { key: 'overtime_multiplier', value: '1.5' },
            { key: 'tax_rate', value: '0.25' },
            { key: 'invoice_due_days', value: '30' },
        ],
    });

    console.log('✅ Created settings');
    console.log('🎉 Seed completed successfully!');

    await prisma.$disconnect();
}

main().catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
});
