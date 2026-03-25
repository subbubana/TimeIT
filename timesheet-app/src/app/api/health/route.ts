// Import initialization to trigger on server start
import '@/lib/init';

import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({ status: 'ok', message: 'Server initialized' });
}
