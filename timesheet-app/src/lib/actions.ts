'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export async function createClient(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const address = formData.get('address') as string;

    if (!name || !email) throw new Error('Name and email are required');

    await prisma.client.create({
        data: {
            name,
            email,
            address,
        },
    });

    revalidatePath('/clients');
}

export async function createEmployee(formData: FormData) {
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const status = formData.get('status') as string || 'active';

    if (!name || !email) throw new Error('Name and email are required');

    await prisma.employee.create({
        data: {
            name,
            email,
            phone,
            status,
        },
    });

    revalidatePath('/employees');
}
