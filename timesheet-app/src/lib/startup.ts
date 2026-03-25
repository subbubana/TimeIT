/**
 * Application Startup Initialization
 * 
 * This module handles initialization tasks that should run when the server starts.
 */

import { emailPoller } from './emailPoller';

let initialized = false;

export async function initializeApp() {
    if (initialized) {
        console.log('[Startup] Already initialized, skipping...');
        return;
    }

    console.log('[Startup] Initializing application...');

    try {
        // Start email polling service
        await emailPoller.start();
        console.log('[Startup] Email polling service started');

        initialized = true;
        console.log('[Startup] Application initialization complete');
    } catch (error) {
        console.error('[Startup] Error during initialization:', error);
        // Don't throw - allow app to start even if polling fails
    }
}

// Cleanup on shutdown
export function shutdownApp() {
    console.log('[Startup] Shutting down application...');

    try {
        emailPoller.stop();
        console.log('[Startup] Email polling service stopped');
    } catch (error) {
        console.error('[Startup] Error during shutdown:', error);
    }
}

// Handle process termination
if (typeof process !== 'undefined') {
    process.on('SIGTERM', shutdownApp);
    process.on('SIGINT', shutdownApp);
}
