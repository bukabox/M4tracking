// hooks/useAutoBackup.ts
import { useEffect, useRef } from 'react';

const BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface BackupResponse {
  status: string;
  message: string;
  backups?: Array<{ file: string; backup: string }>;
  timestamp?: string;
}

export function useAutoBackup(enabled: boolean, onBackupComplete?: (success: boolean, message: string) => void) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const performBackup = async () => {
    try {
      const res = await fetch('/api/create_backup', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data: BackupResponse = await res.json();

      if (res.ok && data.status === 'success') {
        // Save last backup timestamp
        localStorage.setItem('lastBackupTime', new Date().toISOString());
        
        if (onBackupComplete) {
          onBackupComplete(true, data.message || 'Backup created successfully');
        }
        
        console.log('[AutoBackup] Success:', data);
        return true;
      } else {
        if (onBackupComplete) {
          onBackupComplete(false, data.message || 'Backup failed');
        }
        console.warn('[AutoBackup] Failed:', data);
        return false;
      }
    } catch (error) {
      console.error('[AutoBackup] Error:', error);
      if (onBackupComplete) {
        onBackupComplete(false, 'Network error during backup');
      }
      return false;
    }
  };

  const checkAndPerformBackup = async () => {
    const lastBackupTime = localStorage.getItem('lastBackupTime');
    const now = Date.now();

    if (!lastBackupTime) {
      // First time - perform backup immediately
      await performBackup();
      return;
    }

    const lastBackupMs = new Date(lastBackupTime).getTime();
    const timeSinceLastBackup = now - lastBackupMs;

    if (timeSinceLastBackup >= BACKUP_INTERVAL_MS) {
      // Time to backup again
      await performBackup();
    } else {
      console.log(`[AutoBackup] Next backup in ${Math.round((BACKUP_INTERVAL_MS - timeSinceLastBackup) / (1000 * 60 * 60))} hours`);
    }
  };

  useEffect(() => {
    if (!enabled) {
      // Clear interval if backup is disabled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Check immediately on mount/enable
    checkAndPerformBackup();

    // Set up periodic check (every hour to check if it's time to backup)
    intervalRef.current = setInterval(() => {
      checkAndPerformBackup();
    }, 60 * 60 * 1000); // Check every hour

    // Cleanup on unmount or when disabled
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled]);

  return {
    performBackup, // Manual backup trigger
    getLastBackupTime: () => localStorage.getItem('lastBackupTime'),
  };
}
