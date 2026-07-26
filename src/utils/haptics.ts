// Vibration / Haptics feedback for mobile Android touch interaction
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' = 'light') => {
  if (typeof window !== 'undefined' && 'navigator' in window && window.navigator.vibrate) {
    try {
      switch (type) {
        case 'light':
          window.navigator.vibrate(10);
          break;
        case 'medium':
          window.navigator.vibrate(25);
          break;
        case 'heavy':
          window.navigator.vibrate(50);
          break;
        case 'success':
          window.navigator.vibrate([15, 30, 25]);
          break;
        case 'warning':
          window.navigator.vibrate([40, 50, 40]);
          break;
      }
    } catch {
      // Haptic not supported or blocked
    }
  }
};
