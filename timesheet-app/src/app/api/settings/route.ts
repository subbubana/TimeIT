import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { emailPoller } from '@/lib/emailPoller';
import { redirect } from 'next/navigation';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // Convert FormData to object
        const settings: Record<string, string> = {};
        formData.forEach((value, key) => {
            settings[key] = value.toString();
        });

        // Convert tax_rate from percentage to decimal
        if (settings.tax_rate) {
            settings.tax_rate = (parseFloat(settings.tax_rate) / 100).toString();
        }

        // Save all settings to database
        const settingsToUpdate = Object.entries(settings);

        await Promise.all(
            settingsToUpdate.map(([key, value]) =>
                prisma.settings.upsert({
                    where: { key },
                    update: { value },
                    create: { key, value },
                })
            )
        );

        // If any email polling settings were updated, reload the polling service
        const pollingKeys = [
            'email_polling_enabled',
            'email_polling_interval',
            'email_polling_start_hour',
            'email_polling_end_hour',
            'email_polling_timezone',
            'email_polling_weekdays_only',
        ];

        const hasPollingChanges = settingsToUpdate.some(([key]) => pollingKeys.includes(key));

        if (hasPollingChanges) {
            console.log('[Settings API] Polling configuration changed, reloading service...');
            await emailPoller.reload();
        }

        console.log('[Settings API] Settings saved successfully');

        // Redirect back to settings page
        return redirect('/settings');
    } catch (error) {
        console.error('[Settings API] Error saving settings:', error);
        return NextResponse.json(
            { error: 'Failed to save settings' },
            { status: 500 }
        );
    }
}
