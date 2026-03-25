import { google } from 'googleapis';
import prisma from './prisma';

// Gmail OAuth callback URL - different from NextAuth to avoid conflicts
const GMAIL_REDIRECT_URI = process.env.NEXT_PUBLIC_APP_URL
    ? `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/callback`
    : 'http://localhost:3000/api/gmail/callback';

// OAuth2 client setup for Gmail
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    GMAIL_REDIRECT_URI
);

// Cache tokens in memory to avoid constant DB lookups
let storedTokens: {
    access_token?: string;
    refresh_token?: string;
    expiry_date?: number;
} | null = null;

// Listen for token updates (automatic refreshing)
oauth2Client.on('tokens', (tokens) => {
    console.log('[Gmail] Tokens updated/refreshed automatically');
    if (storedTokens && tokens.access_token) {
        const updatedTokens = {
            ...storedTokens,
            ...tokens
        };
        // We can't await here easily, but we'll trigger a background save
        saveTokensToDb(updatedTokens).catch(err =>
            console.error('[Gmail] Failed to save refreshed tokens:', err)
        );
    }
});

async function saveTokensToDb(tokens: typeof storedTokens) {
    if (!tokens) return;
    try {
        // @ts-ignore - Ignore potential prisma generation issues
        await prisma.gmailToken.upsert({
            where: { id: 'singleton' },
            update: {
                accessToken: tokens.access_token || '',
                refreshToken: tokens.refresh_token || undefined,
                expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
            },
            create: {
                id: 'singleton',
                accessToken: tokens.access_token || '',
                refreshToken: tokens.refresh_token,
                expiryDate: tokens.expiry_date ? BigInt(tokens.expiry_date) : null,
            },
        });
        storedTokens = tokens;
    } catch (e) {
        console.error('[Gmail] Database persistence error:', e);
    }
}

export async function setTokens(tokens: typeof storedTokens) {
    console.log('[Gmail] Manually setting tokens');
    if (tokens) {
        oauth2Client.setCredentials(tokens);
        await saveTokensToDb(tokens);
    } else {
        storedTokens = null;
    }
}

export async function getTokens() {
    if (!storedTokens) {
        console.log('[Gmail] No tokens in memory, checking database...');
        try {
            // @ts-ignore
            const dbToken = await prisma.gmailToken.findUnique({
                where: { id: 'singleton' },
            });
            if (dbToken) {
                storedTokens = {
                    access_token: dbToken.accessToken,
                    refresh_token: dbToken.refreshToken || undefined,
                    expiry_date: dbToken.expiryDate ? Number(dbToken.expiryDate) : undefined,
                };
                oauth2Client.setCredentials(storedTokens);
                console.log('[Gmail] Tokens loaded from database');
            } else {
                console.log('[Gmail] No tokens found in database');
            }
        } catch (e) {
            console.error('[Gmail] Error loading tokens from database:', e);
        }
    }
    return storedTokens;
}

export function getAuthUrl(forceAccountSelection: boolean = false): string {
    const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: forceAccountSelection ? 'select_account consent' : 'consent',
    });
}

export async function handleAuthCallback(code: string) {
    console.log('[Gmail] Handling auth callback...');
    const { tokens } = await oauth2Client.getToken(code);
    // Convert null values to undefined for type safety
    const cleanTokens = {
        access_token: tokens.access_token || undefined,
        refresh_token: tokens.refresh_token || undefined,
        expiry_date: tokens.expiry_date || undefined,
    };
    await setTokens(cleanTokens);
    return cleanTokens;
}

export async function getGmailClient() {
    const tokens = await getTokens();
    if (!tokens) {
        throw new Error('Gmail not authenticated. Please authenticate first.');
    }
    // oauth2Client is managed by getTokens/setTokens
    return google.gmail({ version: 'v1', auth: oauth2Client });
}

export interface EmailAttachment {
    filename: string;
    mimeType: string;
    data: Buffer;
    attachmentId: string;
}

export interface EmailMessage {
    messageId: string;
    from: string;
    subject: string;
    date: Date;
    attachments: EmailAttachment[];
}

export async function fetchNewEmailsWithAttachments(
    afterTimestamp?: Date
): Promise<EmailMessage[]> {
    console.log('[Gmail] Fetching new emails with attachments...');
    const gmail = await getGmailClient();

    // Build query - only inbox emails from external senders
    let query = 'has:attachment in:inbox -from:me';
    if (afterTimestamp) {
        const epochSeconds = Math.floor(afterTimestamp.getTime() / 1000);
        query += ` after:${epochSeconds}`;
    }
    console.log(`[Gmail] Search query: ${query}`);

    try {
        // Search for messages
        const listResponse = await gmail.users.messages.list({
            userId: 'me',
            q: query,
            maxResults: 20,
        });

        const messages: EmailMessage[] = [];
        const messageIds = listResponse.data.messages || [];
        console.log(`[Gmail] Found ${messageIds.length} potential messages.`);

        for (const msg of messageIds) {
            if (!msg.id) continue;

            try {
                const fullMessage = await gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id,
                    format: 'full',
                });

                const headers = fullMessage.data.payload?.headers || [];
                const fromHeader = headers.find(h => h.name?.toLowerCase() === 'from');
                const subjectHeader = headers.find(h => h.name?.toLowerCase() === 'subject');
                const dateHeader = headers.find(h => h.name?.toLowerCase() === 'date');

                console.log(`[Gmail] Processing email: "${subjectHeader?.value || 'No Subject'}" from ${fromHeader?.value || 'Unknown'}`);

                const attachments: EmailAttachment[] = [];
                const parts = fullMessage.data.payload?.parts || [];

                for (const part of parts) {
                    if (part.filename && part.body?.attachmentId) {
                        try {
                            // Fetch attachment data
                            const attachmentResponse = await gmail.users.messages.attachments.get({
                                userId: 'me',
                                messageId: msg.id,
                                id: part.body.attachmentId,
                            });

                            if (attachmentResponse.data.data) {
                                // Gmail returns base64url encoded data
                                const data = Buffer.from(attachmentResponse.data.data, 'base64url');

                                attachments.push({
                                    filename: part.filename,
                                    mimeType: part.mimeType || 'application/octet-stream',
                                    data,
                                    attachmentId: part.body.attachmentId,
                                });
                            }
                        } catch (attError) {
                            console.error(`[Gmail] Error fetching attachment ${part.filename}:`, attError);
                        }
                    }
                }

                messages.push({
                    messageId: msg.id,
                    from: fromHeader?.value || 'Unknown',
                    subject: subjectHeader?.value || 'No Subject',
                    date: dateHeader?.value ? new Date(dateHeader.value) : new Date(),
                    attachments,
                });
            } catch (msgError) {
                console.error(`[Gmail] Error fetching message details for ${msg.id}:`, msgError);
            }
        }

        return messages;
    } catch (error: any) {
        console.error('[Gmail] API Error during list/fetch:', error.message);
        if (error.response?.data) {
            console.error('[Gmail] Response Data:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

export async function markEmailAsRead(messageId: string) {
    console.log(`[Gmail] Marking email ${messageId} as read...`);
    try {
        const gmail = await getGmailClient();
        await gmail.users.messages.modify({
            userId: 'me',
            id: messageId,
            requestBody: {
                removeLabelIds: ['UNREAD'],
            },
        });
    } catch (error) {
        console.error(`[Gmail] Error marking email ${messageId} as read:`, error);
    }
}
