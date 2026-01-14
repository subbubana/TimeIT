// Test Prisma 7 client initialization
require('dotenv').config();

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');

const { PrismaClient } = require('@prisma/client');

try {
    console.log('Creating PrismaClient...');
    const prisma = new PrismaClient();
    console.log('PrismaClient created');

    prisma.$connect()
        .then(() => {
            console.log('Connected!');
            return prisma.client.count();
        })
        .then((count) => {
            console.log('Client count:', count);
            return prisma.$disconnect();
        })
        .then(() => {
            console.log('Disconnected');
            process.exit(0);
        })
        .catch((err) => {
            console.error('Error:', err);
            process.exit(1);
        });
} catch (err) {
    console.error('Constructor error:', err);
    process.exit(1);
}
