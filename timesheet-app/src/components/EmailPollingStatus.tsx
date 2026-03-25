'use client';

import { useEffect, useState } from 'react';
import { Clock, Play, Square, RefreshCw } from 'lucide-react';

interface PollingStatus {
    isRunning: boolean;
    lastCheckTime: string | null;
    nextCheckTime: string | null;
    isBusinessHours: boolean;
    config: {
        enabled: boolean;
        intervalMinutes: number;
        startHour: number;
        endHour: number;
        timezone: string;
        weekdaysOnly: boolean;
    };
}

export default function EmailPollingStatus() {
    const [status, setStatus] = useState<PollingStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeUntilNext, setTimeUntilNext] = useState<string>('');

    const fetchStatus = async () => {
        try {
            const response = await fetch('/api/email/polling/status');
            const data = await response.json();
            if (data.success) {
                setStatus(data);
            }
        } catch (error) {
            console.error('Error fetching polling status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async () => {
        try {
            await fetch('/api/email/polling/start', { method: 'POST' });
            await fetchStatus();
        } catch (error) {
            console.error('Error starting polling:', error);
        }
    };

    const handleStop = async () => {
        try {
            await fetch('/api/email/polling/stop', { method: 'POST' });
            await fetchStatus();
        } catch (error) {
            console.error('Error stopping polling:', error);
        }
    };

    useEffect(() => {
        fetchStatus();
        const interval = setInterval(fetchStatus, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!status?.nextCheckTime) {
            setTimeUntilNext('');
            return;
        }

        const updateCountdown = () => {
            const next = new Date(status.nextCheckTime!);
            const now = new Date();
            const diff = next.getTime() - now.getTime();

            if (diff <= 0) {
                setTimeUntilNext('Checking now...');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (hours > 0) {
                setTimeUntilNext(`${hours}h ${minutes}m`);
            } else {
                setTimeUntilNext(`${minutes}m`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [status?.nextCheckTime]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <RefreshCw size={16} className="animate-spin" />
                <span>Loading...</span>
            </div>
        );
    }

    if (!status) {
        return null;
    }

    const formatTime = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    return (
        <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <div className="flex items-center gap-2">
                <div
                    className={`w-2 h-2 rounded-full ${status.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                        }`}
                    title={status.isRunning ? 'Polling Active' : 'Polling Paused'}
                />
                <span className="text-sm font-medium">
                    {status.isRunning ? 'Auto-Check Active' : 'Auto-Check Paused'}
                </span>
            </div>

            {/* Next Check Time */}
            {status.isRunning && status.nextCheckTime && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Clock size={14} />
                    <span>
                        Next: {formatTime(status.nextCheckTime)}
                        {timeUntilNext && <span className="text-gray-400 ml-1">({timeUntilNext})</span>}
                    </span>
                </div>
            )}

            {/* Business Hours Indicator */}
            {!status.isBusinessHours && (
                <div className="text-xs text-gray-500 italic">
                    Outside business hours
                </div>
            )}

            {/* Control Buttons (Optional - can be hidden in production) */}
            {process.env.NODE_ENV === 'development' && (
                <div className="flex gap-1">
                    {!status.isRunning ? (
                        <button
                            onClick={handleStart}
                            className="btn-ghost p-1"
                            title="Start Polling"
                        >
                            <Play size={14} />
                        </button>
                    ) : (
                        <button
                            onClick={handleStop}
                            className="btn-ghost p-1"
                            title="Stop Polling"
                        >
                            <Square size={14} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
