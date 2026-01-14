import 'dotenv/config';
import { PrismaClient, Prisma } from '@prisma/client';

// Prisma 7: datasource URL is configured in prisma.config.ts
const prisma = new PrismaClient();

async function main() {
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
        prisma.employee.create({
            data: {
                name: 'Charlie Davis',
                email: 'charlie.davis@alphatech.com',
                phone: '+1-555-0105',
                status: 'inactive',
            },
        }),
    ]);

    console.log(`✅ Created ${employees.length} employees`);

    // Create Employee Assignments (with bill rates and pay rates)
    const assignments = await Promise.all([
        prisma.employeeAssignment.create({
            data: {
                employeeId: employees[0].id, // John Doe
                clientId: clients[0].id, // Bank of America
                billRate: new Prisma.Decimal(75.0),
                payRate: new Prisma.Decimal(50.0),
                startDate: new Date('2024-01-01'),
            },
        }),
        prisma.employeeAssignment.create({
            data: {
                employeeId: employees[1].id, // Jane Smith
                clientId: clients[0].id, // Bank of America
                billRate: new Prisma.Decimal(95.0),
                payRate: new Prisma.Decimal(65.0),
                startDate: new Date('2024-02-01'),
            },
        }),
        prisma.employeeAssignment.create({
            data: {
                employeeId: employees[2].id, // Bob Wilson
                clientId: clients[1].id, // Wells Fargo
                billRate: new Prisma.Decimal(85.0),
                payRate: new Prisma.Decimal(55.0),
                startDate: new Date('2024-01-15'),
            },
        }),
        prisma.employeeAssignment.create({
            data: {
                employeeId: employees[3].id, // Alice Brown
                clientId: clients[2].id, // JPMorgan Chase
                billRate: new Prisma.Decimal(90.0),
                payRate: new Prisma.Decimal(60.0),
                startDate: new Date('2024-03-01'),
            },
        }),
        prisma.employeeAssignment.create({
            data: {
                employeeId: employees[4].id, // Charlie Davis
                clientId: clients[1].id, // Wells Fargo
                billRate: new Prisma.Decimal(80.0),
                payRate: new Prisma.Decimal(52.0),
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-12-31'),
            },
        }),
    ]);

    console.log(`✅ Created ${assignments.length} employee assignments`);

    // Create Timesheets with various statuses
    const now = new Date();
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const timesheets = await Promise.all([
        // Approved timesheet for John Doe
        prisma.timesheet.create({
            data: {
                employeeId: employees[0].id,
                periodStart: twoWeeksAgo,
                periodEnd: oneWeekAgo,
                regularHours: new Prisma.Decimal(40),
                overtimeHours: new Prisma.Decimal(5),
                status: 'approved',
                sourceType: 'email',
                sourceReference: 'email-12345',
                approvedAt: oneWeekAgo,
            },
        }),
        // Pending timesheet for John Doe (current period)
        prisma.timesheet.create({
            data: {
                employeeId: employees[0].id,
                periodStart: oneWeekAgo,
                periodEnd: now,
                regularHours: new Prisma.Decimal(38),
                overtimeHours: new Prisma.Decimal(2),
                status: 'pending',
                sourceType: 'upload',
            },
        }),
        // Approved timesheet for Jane Smith
        prisma.timesheet.create({
            data: {
                employeeId: employees[1].id,
                periodStart: twoWeeksAgo,
                periodEnd: oneWeekAgo,
                regularHours: new Prisma.Decimal(40),
                overtimeHours: new Prisma.Decimal(0),
                status: 'approved',
                sourceType: 'email',
                sourceReference: 'email-12346',
                approvedAt: oneWeekAgo,
            },
        }),
        // Pending timesheet for Bob Wilson
        prisma.timesheet.create({
            data: {
                employeeId: employees[2].id,
                periodStart: oneWeekAgo,
                periodEnd: now,
                regularHours: new Prisma.Decimal(40),
                overtimeHours: new Prisma.Decimal(8),
                status: 'pending',
                sourceType: 'manual',
            },
        }),
        // Rejected timesheet for Alice Brown
        prisma.timesheet.create({
            data: {
                employeeId: employees[3].id,
                periodStart: twoWeeksAgo,
                periodEnd: oneWeekAgo,
                regularHours: new Prisma.Decimal(45),
                overtimeHours: new Prisma.Decimal(0),
                status: 'rejected',
                sourceType: 'email',
                sourceReference: 'email-12347',
            },
        }),
        // Approved for Alice (corrected)
        prisma.timesheet.create({
            data: {
                employeeId: employees[3].id,
                periodStart: twoWeeksAgo,
                periodEnd: oneWeekAgo,
                regularHours: new Prisma.Decimal(40),
                overtimeHours: new Prisma.Decimal(5),
                status: 'approved',
                sourceType: 'upload',
                approvedAt: now,
            },
        }),
    ]);

    console.log(`✅ Created ${timesheets.length} timesheets`);

    // Create Invoices for approved timesheets
    const invoices = await Promise.all([
        prisma.invoice.create({
            data: {
                clientId: clients[0].id,
                timesheetId: timesheets[0].id,
                invoiceNo: 'INV-2026-001',
                amount: new Prisma.Decimal(3562.5), // (40*75) + (5*75*1.5)
                status: 'paid',
                dueDate: new Date(twoWeeksAgo.getTime() + 30 * 24 * 60 * 60 * 1000),
                paidAt: oneWeekAgo,
            },
        }),
        prisma.invoice.create({
            data: {
                clientId: clients[0].id,
                timesheetId: timesheets[2].id,
                invoiceNo: 'INV-2026-002',
                amount: new Prisma.Decimal(3800), // 40*95
                status: 'sent',
                dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            },
        }),
        prisma.invoice.create({
            data: {
                clientId: clients[2].id,
                timesheetId: timesheets[5].id,
                invoiceNo: 'INV-2026-003',
                amount: new Prisma.Decimal(4275), // (40*90) + (5*90*1.5)
                status: 'draft',
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
                grossPay: new Prisma.Decimal(2375), // (40*50) + (5*50*1.5)
                netPay: new Prisma.Decimal(1781.25), // 75% after taxes
                taxes: new Prisma.Decimal(593.75),
                status: 'processed',
                processedAt: oneWeekAgo,
            },
        }),
        prisma.payroll.create({
            data: {
                employeeId: employees[1].id,
                timesheetId: timesheets[2].id,
                grossPay: new Prisma.Decimal(2600), // 40*65
                netPay: new Prisma.Decimal(1950),
                taxes: new Prisma.Decimal(650),
                status: 'pending',
            },
        }),
        prisma.payroll.create({
            data: {
                employeeId: employees[3].id,
                timesheetId: timesheets[5].id,
                grossPay: new Prisma.Decimal(2850), // (40*60) + (5*60*1.5)
                netPay: new Prisma.Decimal(2137.5),
                taxes: new Prisma.Decimal(712.5),
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
            { key: 'email_check_interval_minutes', value: '5' },
        ],
    });

    console.log('✅ Created settings');

    console.log('🎉 Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
