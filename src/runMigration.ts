import { runMigration } from './firebase/migration';

/**
 * Run this script to migrate the database
 *
 * Usage:
 * 1. Ensure you're authenticated with Firebase (logged in as admin/owner)
 * 2. Run: npm run migrate (or node this script if configured)
 * 3. Review the console output for results
 *
 * Note: This can also be called from the browser console if needed:
 * - Open your app in the browser
 * - Open developer console
 * - Import and run: import { runMigration } from './firebase/migration'; runMigration();
 */

async function main() {
    try {
        console.log('Starting migration...');
        const result = await runMigration();

        if (result.success) {
            console.log('✓ Migration completed successfully!');
            process.exit(0);
        } else {
            console.error('✗ Migration completed with errors');
            process.exit(1);
        }
    } catch (error) {
        console.error('✗ Migration failed:', error);
        process.exit(1);
    }
}

// Check if running in Node.js environment
if (typeof process !== 'undefined' && process.versions?.node) {
    main();
}

export default main;
