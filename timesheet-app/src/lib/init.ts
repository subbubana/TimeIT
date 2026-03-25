import { initializeApp } from '@/lib/startup';

// Initialize the app when this module is imported
// This will run once when the Next.js server starts
initializeApp().catch(error => {
    console.error('[Init] Failed to initialize app:', error);
});

// Export a dummy function to make this a valid module
export function init() {
    return true;
}
