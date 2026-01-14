import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { fetchNewEmailsWithAttachments, getTokens } from '@/lib/gmail';
import { parseTimesheetWithGemini } from '@/lib/gemini';

export async function POST(request: NextRequest) {
    console.log('[API] POST /api/email/check - Starting check...');
    try {
        // Check if Gmail is authenticated
        const tokens = await getTokens();
        if (!tokens) {
            console.warn('[API] Gmail not authenticated');
            return NextResponse.json(
                {
                    error: 'Gmail not authenticated',
                    authUrl: '/api/auth/gmail'
                },
                { status: 401 }
            );
        }

        // Get the last check timestamp from settings
        const lastCheckSetting = await prisma.settings.findUnique({
            where: { key: 'last_email_check' },
        });
        const lastCheck = lastCheckSetting
            ? new Date(lastCheckSetting.value)
            : new Date(Date.now() - 24 * 60 * 60 * 1000); // Default to 24 hours ago

        console.log(`[API] Last check was at: ${lastCheck.toISOString()}`);

        // Fetch new emails
        const emails = await fetchNewEmailsWithAttachments(lastCheck);
        console.log(`[API] Fetched ${emails.length} new emails to process.`);

        const results = {
            processed: 0,
            skipped: 0,
            errors: [] as string[],
        };

        for (const email of emails) {
            console.log(`[API] Processing email: ${email.messageId} (${email.subject})`);
            // Check if already processed
            const existing = await prisma.emailLog.findUnique({
                where: { messageId: email.messageId },
            });

            if (existing) {
                console.log(`[API] Email ${email.messageId} already exists in logs, skipping.`);
                results.skipped++;
                continue;
            }

            // Create initial email log entry
            console.log(`[API] Creating log entry for ${email.messageId}...`);
            const emailLog = await prisma.emailLog.create({
                data: {
                    messageId: email.messageId,
                    fromAddress: email.from,
                    subject: email.subject,
                    receivedAt: email.date,
                    processed: false,
                    // @ts-ignore
                    attachmentCount: email.attachments.length,
                },
            });

            const processedAttachments = [];
            let lastError = null;
            let matchedTimesheetId = null;

            try {
                // Process each attachment
                console.log(`[API] Found ${email.attachments.length} attachments to process.`);
                for (const attachment of email.attachments) {
                    console.log(`[API] Processing attachment: ${attachment.filename} (${attachment.mimeType})`);
                    // Only process PDFs and images
                    const supportedTypes = [
                        'application/pdf',
                        'image/png',
                        'image/jpeg',
                        'image/jpg',
                        'image/webp',
                    ];

                    if (!supportedTypes.includes(attachment.mimeType)) {
                        console.log(`[API] Skipping unsupported attachment type: ${attachment.mimeType}`);
                        processedAttachments.push({
                            filename: attachment.filename,
                            mimeType: attachment.mimeType,
                            status: 'skipped',
                            reason: 'unsupported_type'
                        });
                        continue;
                    }

                    // Parse with Gemini
                    console.log(`[API] Sending ${attachment.filename} to Gemini...`);
                    const extraction = await parseTimesheetWithGemini(
                        attachment.data,
                        attachment.mimeType
                    );
                    console.log(`[API] Gemini extraction complete for ${attachment.filename}`);

                    const attachmentInfo: any = {
                        filename: attachment.filename,
                        mimeType: attachment.mimeType,
                        extraction: extraction,
                        status: 'extracted'
                    };

                    // Try to match employee for timesheet creation
                    try {
                        let employee = null;
                        if (extraction.employeeEmail) {
                            console.log(`[API] Searching for employee by email: ${extraction.employeeEmail}`);
                            employee = await prisma.employee.findUnique({
                                where: { email: extraction.employeeEmail },
                            });
                        }
                        if (!employee && extraction.employeeName) {
                            console.log(`[API] Searching for employee by name: ${extraction.employeeName}`);
                            employee = await prisma.employee.findFirst({
                                where: {
                                    name: { contains: extraction.employeeName, mode: 'insensitive' }
                                },
                            });
                        }

                        if (employee) {
                            console.log(`[API] Match found: ${employee.name} (ID: ${employee.id})`);
                            // Create timesheet
                            const periodStart = extraction.periodStart
                                ? new Date(extraction.periodStart)
                                : new Date();
                            const periodEnd = extraction.periodEnd
                                ? new Date(extraction.periodEnd)
                                : new Date();

                            console.log('[API] Creating timesheet record...');
                            const ts = await prisma.timesheet.create({
                                data: {
                                    employeeId: employee.id,
                                    periodStart,
                                    periodEnd,
                                    regularHours: extraction.regularHours || 0,
                                    overtimeHours: extraction.overtimeHours || 0,
                                    status: 'pending',
                                    sourceType: 'email',
                                    sourceReference: email.messageId,
                                    rawData: extraction as object,
                                },
                            });

                            attachmentInfo.status = 'timesheet_created';
                            attachmentInfo.timesheetId = ts.id;
                            matchedTimesheetId = employee.id; // Legacy link
                            results.processed++;
                            console.log(`[API] Timesheet created: ${ts.id}`);
                        } else {
                            console.warn(`[API] No employee match found for ${extraction.employeeName || extraction.employeeEmail}`);
                            attachmentInfo.status = 'no_employee_match';
                            attachmentInfo.reason = `Could not match employee: ${extraction.employeeName || extraction.employeeEmail || 'Unknown'}`;
                        }
                    } catch (e) {
                        console.error('[API] Error creating timesheet from attachment:', e);
                        attachmentInfo.status = 'timesheet_error';
                        attachmentInfo.error = e instanceof Error ? e.message : 'Unknown error';
                    }

                    processedAttachments.push(attachmentInfo);
                }

                // Update email log with all results
                console.log(`[API] Finalizing log entry for ${email.messageId}...`);
                await prisma.emailLog.update({
                    where: { id: emailLog.id },
                    data: {
                        processed: true,
                        // @ts-ignore
                        attachments: processedAttachments as any,
                        timesheetId: matchedTimesheetId,
                    },
                });

            } catch (error) {
                lastError = error instanceof Error ? error.message : 'Unknown error';
                console.error(`[API] Fatal error processing email ${email.messageId}:`, lastError);
                await prisma.emailLog.update({
                    where: { id: emailLog.id },
                    data: {
                        error: lastError,
                        // @ts-ignore
                        attachments: processedAttachments as any
                    },
                });
                results.errors.push(`${email.subject}: ${lastError}`);
            }
        }

        // Update last check timestamp
        console.log('[API] Updating last check timestamp...');
        await prisma.settings.upsert({
            where: { key: 'last_email_check' },
            update: { value: new Date().toISOString() },
            create: { key: 'last_email_check', value: new Date().toISOString() },
        });

        console.log(`[API] Check complete. Results: ${JSON.stringify(results)}`);
        return NextResponse.json({
            success: true,
            ...results,
            totalEmails: emails.length,
        });
    } catch (error) {
        console.error('[API] Global error in email check:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to check emails' },
            { status: 500 }
        );
    }
}

export async function GET() {
    // Return authentication status
    const tokens = await getTokens();
    return NextResponse.json({
        authenticated: !!tokens,
        authUrl: tokens ? null : '/api/auth/gmail',
    });
}
