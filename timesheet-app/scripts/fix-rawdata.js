const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting migration to add missing rawData...');

    // Update Email records
    const result1 = await prisma.timesheet.updateMany({
        where: {
            sourceType: 'email'
        },
        data: {
            rawData: {
                note: 'Sourced from Email (Seed Data)',
                model: 'historical-import',
                extractedAt: new Date().toISOString()
            }
        }
    });
    console.log(`Updated ${result1.count} Email records.`);

    // Update Upload records
    const result2 = await prisma.timesheet.updateMany({
        where: {
            sourceType: 'upload'
        },
        data: {
            rawData: {
                note: 'Manual Upload (Seed Data)',
                status: 'pre-verified',
                verifiedAt: new Date().toISOString()
            }
        }
    });
    console.log(`Updated ${result2.count} Upload records.`);

    console.log('Migration complete.');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
