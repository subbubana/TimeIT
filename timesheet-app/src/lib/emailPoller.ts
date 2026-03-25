/**
 * Email Polling Service
 * 
 * Automatically checks for new emails during business hours (9 AM - 5 PM)
 * at 60-minute intervals. Supports timezone configuration via database settings.
 */

import prisma from './prisma';

interface PollingConfig {
    enabled: boolean;
    intervalMinutes: number;
    startHour: number; // 0-23
    endHour: number; // 0-23
    timezone: string; // IANA timezone (e.g., 'America/Chicago')
    weekdaysOnly: boolean;
}

class EmailPollingService {
    private static instance: EmailPollingService;
    private timerId: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;
    private lastCheckTime: Date | null = null;
    private nextCheckTime: Date | null = null;
    private config: PollingConfig = {
        enabled: true,
        intervalMinutes: 60,
        startHour: 9,
        endHour: 17,
        timezone: 'America/Chicago',
        weekdaysOnly: true,
    };

    private constructor() {
        // Private constructor for singleton
    }

    public static getInstance(): EmailPollingService {
        if (!EmailPollingService.instance) {
            EmailPollingService.instance = new EmailPollingService();
        }
        return EmailPollingService.instance;
    }

    /**
     * Load configuration from database settings
     */
    private async loadConfig(): Promise<void> {
        try {
            const settings = await prisma.settings.findMany({
                where: {
                    key: {
                        in: [
                            'email_polling_enabled',
                            'email_polling_interval',
                            'email_polling_start_hour',
                            'email_polling_end_hour',
                            'email_polling_timezone',
                            'email_polling_weekdays_only',
                        ],
                    },
                },
            });

            const settingsMap = new Map(settings.map(s => [s.key, s.value]));

            this.config = {
                enabled: settingsMap.get('email_polling_enabled') !== 'false',
                intervalMinutes: parseInt(settingsMap.get('email_polling_interval') || '60'),
                startHour: parseInt(settingsMap.get('email_polling_start_hour') || '9'),
                endHour: parseInt(settingsMap.get('email_polling_end_hour') || '17'),
                timezone: settingsMap.get('email_polling_timezone') || 'America/Chicago',
                weekdaysOnly: settingsMap.get('email_polling_weekdays_only') !== 'false',
            };

            console.log('[EmailPoller] Configuration loaded:', this.config);
        } catch (error) {
            console.error('[EmailPoller] Error loading config, using defaults:', error);
        }
    }

    /**
     * Check if current time is within business hours
     */
    private isBusinessHours(now?: Date): boolean {
        const checkTime = now || this.getCurrentTime();
        const hour = checkTime.getHours();
        const day = checkTime.getDay(); // 0 = Sunday, 6 = Saturday

        // Check weekday
        if (this.config.weekdaysOnly && (day === 0 || day === 6)) {
            return false;
        }

        // Check hour (endHour is exclusive, so 17 means up to 4:59 PM)
        return hour >= this.config.startHour && hour < this.config.endHour;
    }

    /**
     * Get current time in configured timezone
     */
    private getCurrentTime(): Date {
        // Convert to timezone-aware date
        const now = new Date();
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: this.config.timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        });

        const parts = formatter.formatToParts(now);
        const get = (type: string) => parts.find(p => p.type === type)?.value || '0';

        return new Date(
            parseInt(get('year')),
            parseInt(get('month')) - 1,
            parseInt(get('day')),
            parseInt(get('hour')),
            parseInt(get('minute')),
            parseInt(get('second'))
        );
    }

    /**
     * Calculate the next check time based on current time and business hours
     */
    private calculateNextCheckTime(): Date {
        const now = this.getCurrentTime();
        const next = new Date(now);

        if (this.isBusinessHours(now)) {
            // We're in business hours - schedule for next hour
            next.setHours(now.getHours() + 1, 0, 0, 0);

            // If next hour is outside business hours, schedule for tomorrow 9 AM
            if (!this.isBusinessHours(next)) {
                next.setDate(next.getDate() + 1);
                next.setHours(this.config.startHour, 0, 0, 0);
            }
        } else {
            // We're outside business hours - schedule for next business day at start hour
            next.setHours(this.config.startHour, 0, 0, 0);

            // If it's after business hours today, move to tomorrow
            if (now.getHours() >= this.config.endHour) {
                next.setDate(next.getDate() + 1);
            }

            // Skip weekends if weekdays only
            if (this.config.weekdaysOnly) {
                while (next.getDay() === 0 || next.getDay() === 6) {
                    next.setDate(next.getDate() + 1);
                }
            }
        }

        return next;
    }

    /**
     * Perform the email check
     */
    private async performCheck(): Promise<void> {
        console.log('[EmailPoller] Performing scheduled email check...');
        this.lastCheckTime = new Date();

        try {
            // Call the email check API internally
            const response = await fetch('http://localhost:3000/api/email/check', {
                method: 'POST',
            });

            const data = await response.json();

            if (data.success) {
                console.log(
                    `[EmailPoller] Check complete: ${data.totalEmails} emails, ` +
                    `${data.processed} processed, ${data.skipped} skipped`
                );
            } else {
                console.error('[EmailPoller] Check failed:', data.error);
            }
        } catch (error) {
            console.error('[EmailPoller] Error during check:', error);
        }

        // Schedule next check
        this.scheduleNextCheck();
    }

    /**
     * Schedule the next check
     */
    private scheduleNextCheck(): void {
        // Clear existing timer
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }

        if (!this.config.enabled) {
            console.log('[EmailPoller] Polling disabled, not scheduling next check');
            this.isRunning = false;
            return;
        }

        this.nextCheckTime = this.calculateNextCheckTime();
        const now = this.getCurrentTime();
        const delay = this.nextCheckTime.getTime() - now.getTime();

        console.log(
            `[EmailPoller] Next check scheduled for: ${this.nextCheckTime.toLocaleString('en-US', {
                timeZone: this.config.timezone,
            })} (in ${Math.round(delay / 1000 / 60)} minutes)`
        );

        this.timerId = setTimeout(() => {
            this.performCheck();
        }, delay);
    }

    /**
     * Start the polling service
     */
    public async start(): Promise<void> {
        if (this.isRunning) {
            console.log('[EmailPoller] Already running');
            return;
        }

        console.log('[EmailPoller] Starting email polling service...');
        await this.loadConfig();

        if (!this.config.enabled) {
            console.log('[EmailPoller] Polling is disabled in configuration');
            return;
        }

        this.isRunning = true;

        // If we're in business hours, do an immediate check
        if (this.isBusinessHours()) {
            console.log('[EmailPoller] In business hours - performing immediate check');
            await this.performCheck();
        } else {
            console.log('[EmailPoller] Outside business hours - scheduling next check');
            this.scheduleNextCheck();
        }
    }

    /**
     * Stop the polling service
     */
    public stop(): void {
        console.log('[EmailPoller] Stopping email polling service...');

        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }

        this.isRunning = false;
        this.nextCheckTime = null;
    }

    /**
     * Reload configuration and restart if running
     */
    public async reload(): Promise<void> {
        console.log('[EmailPoller] Reloading configuration...');
        const wasRunning = this.isRunning;

        this.stop();
        await this.loadConfig();

        if (wasRunning && this.config.enabled) {
            await this.start();
        }
    }

    /**
     * Get current status
     */
    public getStatus() {
        return {
            isRunning: this.isRunning,
            lastCheckTime: this.lastCheckTime,
            nextCheckTime: this.nextCheckTime,
            config: this.config,
            isBusinessHours: this.isBusinessHours(),
            currentTime: this.getCurrentTime(),
        };
    }
}

// Export singleton instance
export const emailPoller = EmailPollingService.getInstance();
