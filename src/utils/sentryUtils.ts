import * as Sentry from '@sentry/react';

/**
 * Utility functions for Sentry error reporting and testing
 */

/**
 * Manually capture an exception to Sentry
 * Useful for testing or reporting custom errors
 * 
 * @example
 * // Report a custom error
 * reportError(new Error('Custom error message'), { 
 *   tags: { feature: 'serial-port' },
 *   extra: { userId: '123' }
 * });
 */
export function reportError(
    error: Error,
    options?: {
        tags?: Record<string, string>;
        extra?: Record<string, unknown>;
        level?: 'error' | 'warning' | 'info' | 'debug';
    }
): void {
    Sentry.captureException(error, {
        tags: options?.tags,
        extra: options?.extra,
        level: options?.level || 'error',
    });
}

/**
 * Manually capture a message to Sentry
 * Useful for logging important events or warnings
 * 
 * @example
 * // Log a warning
 * reportMessage('Port connection timeout', 'warning', {
 *   tags: { operation: 'connect' },
 *   extra: { portName: 'COM3', timeout: 5000 }
 * });
 */
export function reportMessage(
    message: string,
    level: 'error' | 'warning' | 'info' | 'debug' = 'info',
    options?: {
        tags?: Record<string, string>;
        extra?: Record<string, unknown>;
    }
): void {
    Sentry.captureMessage(message, {
        level,
        tags: options?.tags,
        extra: options?.extra,
    });
}

/**
 * Test function to manually trigger a Sentry error
 * Useful for testing error reporting in development
 * 
 * @example
 * // In browser console or a test button:
 * import { testSentryError } from './utils/sentryUtils';
 * testSentryError();
 */
export function testSentryError(): void {
    try {
        throw new Error('Test error for Sentry - This is intentional for testing');
    } catch (error) {
        reportError(error as Error, {
            tags: { test: 'true', source: 'manual-test' },
            level: 'info',
        });
    }
}

/**
 * Add breadcrumb to Sentry for debugging
 * Breadcrumbs help track user actions leading up to an error
 * 
 * @example
 * // Track user action
 * addBreadcrumb('User clicked connect button', {
 *   category: 'user-action',
 *   level: 'info',
 *   data: { portName: 'COM3', baudRate: 115200 }
 * });
 */
export function addBreadcrumb(
    message: string,
    options?: {
        category?: string;
        level?: 'error' | 'warning' | 'info' | 'debug';
        data?: Record<string, unknown>;
    }
): void {
    Sentry.addBreadcrumb({
        message,
        category: options?.category || 'default',
        level: options?.level || 'info',
        data: options?.data,
    });
}

