import { useState, useEffect, useRef, useCallback } from 'react';
import { Landmark } from '../types/pose';
import { PostureAlert, checkGeneralPosture } from '../utils/postureRules';
import { SquatFormAlert, checkSquatForm, isSquatPosition } from '../utils/squatRules';

// Debounce time before showing alert (avoid flicker)
const ALERT_DEBOUNCE_MS = 500;
// Minimum time between audio alerts
const AUDIO_THROTTLE_MS = 2000;
// Audio settings
const BEEP_FREQUENCY = 440; // Hz (A4 note)
const BEEP_DURATION = 100; // ms
const BEEP_VOLUME = 0.3;

export type ExerciseMode = 'general' | 'squat' | 'pushup';

type ExerciseAlert = PostureAlert | SquatFormAlert;

interface UseExerciseAlertsReturn {
  currentAlert: ExerciseAlert | null;
  playAlertSound: () => void;
  isExercising: boolean;
}

export function useExerciseAlerts(
  landmarks: Landmark[] | null,
  mode: ExerciseMode
): UseExerciseAlertsReturn {
  const [currentAlert, setCurrentAlert] = useState<ExerciseAlert | null>(null);
  const [isExercising, setIsExercising] = useState(false);

  // Refs for timing and audio
  const badPostureStartRef = useRef<number | null>(null);
  const lastAudioPlayedRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const pendingAlertRef = useRef<ExerciseAlert | null>(null);

  /**
   * Create or get AudioContext (lazy initialization for Chrome autoplay policy)
   */
  const getAudioContext = useCallback((): AudioContext | null => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      } catch (e) {
        console.warn('Web Audio API not supported:', e);
        return null;
      }
    }
    return audioContextRef.current;
  }, []);

  /**
   * Play alert beep sound using Web Audio API
   */
  const playAlertSound = useCallback(() => {
    const now = Date.now();

    // Throttle audio to avoid rapid beeping
    if (now - lastAudioPlayedRef.current < AUDIO_THROTTLE_MS) {
      return;
    }

    const audioContext = getAudioContext();
    if (!audioContext) return;

    // Resume audio context if suspended (Chrome autoplay policy)
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    try {
      // Create oscillator for beep
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(BEEP_FREQUENCY, audioContext.currentTime);

      // Set volume
      gainNode.gain.setValueAtTime(BEEP_VOLUME, audioContext.currentTime);
      // Quick fade out at the end for cleaner sound
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + BEEP_DURATION / 1000);

      // Connect oscillator -> gain -> output
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Play the beep
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + BEEP_DURATION / 1000);

      lastAudioPlayedRef.current = now;
    } catch (e) {
      console.warn('Failed to play alert sound:', e);
    }
  }, [getAudioContext]);

  /**
   * Get alert based on exercise mode
   */
  const getAlert = useCallback((landmarks: Landmark[]): ExerciseAlert | null => {
    switch (mode) {
      case 'squat': {
        // Check if in squat position
        const inSquatPosition = isSquatPosition(landmarks);
        setIsExercising(inSquatPosition);

        if (inSquatPosition) {
          // In squat - check squat-specific form
          return checkSquatForm(landmarks);
        } else {
          // Standing between reps - check general posture
          return checkGeneralPosture(landmarks);
        }
      }
      case 'pushup': {
        // Placeholder for Plan 02 - use general posture for now
        setIsExercising(false);
        return checkGeneralPosture(landmarks);
      }
      case 'general':
      default: {
        setIsExercising(false);
        return checkGeneralPosture(landmarks);
      }
    }
  }, [mode]);

  /**
   * Check posture/form on each landmarks update
   */
  useEffect(() => {
    if (!landmarks) {
      // No landmarks - clear alert and reset timer
      setCurrentAlert(null);
      setIsExercising(false);
      badPostureStartRef.current = null;
      pendingAlertRef.current = null;
      return;
    }

    const alert = getAlert(landmarks);
    const now = Date.now();

    if (alert) {
      // Bad form detected
      if (!badPostureStartRef.current) {
        // Start tracking bad form duration
        badPostureStartRef.current = now;
        pendingAlertRef.current = alert;
      } else if (now - badPostureStartRef.current >= ALERT_DEBOUNCE_MS) {
        // Bad form has persisted long enough - show alert
        if (!currentAlert || currentAlert.type !== alert.type) {
          // New alert or different type - play sound
          setCurrentAlert(alert);
          playAlertSound();
        } else {
          // Same alert type - just update (no sound)
          setCurrentAlert(alert);
        }
      }
    } else {
      // Form is good - clear alert immediately
      setCurrentAlert(null);
      badPostureStartRef.current = null;
      pendingAlertRef.current = null;
    }
  }, [landmarks, currentAlert, playAlertSound, getAlert]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  return {
    currentAlert,
    playAlertSound,
    isExercising,
  };
}
