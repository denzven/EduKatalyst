/**
 * Anti-Cheating Speed Breakers & DevTools Protection Module
 * 
 * Features:
 * 1. Blocks right-click context menu
 * 2. Blocks F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
 * 3. Detects open browser DevTools via dimension delta checks and debugger timing loops
 */

export function initAntiCheatProtection(onDevToolsDetected) {
  let devToolsOpen = false;

  // 1. Context Menu Blocker
  const handleContextMenu = (e) => {
    e.preventDefault();
    return false;
  };

  // 2. Keyboard Shortcut Blocker
  const handleKeyDown = (e) => {
    // Block F12
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault();
      e.stopPropagation();
      onDevToolsDetected?.(true);
      return false;
    }

    // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
    if (
      (e.ctrlKey || e.metaKey) &&
      (e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c'))
    ) {
      e.preventDefault();
      e.stopPropagation();
      onDevToolsDetected?.(true);
      return false;
    }

    if ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault();
      e.stopPropagation();
      onDevToolsDetected?.(true);
      return false;
    }
  };

  // 3. DevTools Window Dimension Check & Debugger Timing Check
  const checkDevTools = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;

    // Timing check via debugger statement
    const startTime = performance.now();
    // eslint-disable-next-line no-debugger
    debugger;
    const endTime = performance.now();
    const debuggerTriggered = endTime - startTime > 100;

    const isOpenNow = widthThreshold || heightThreshold || debuggerTriggered;

    if (isOpenNow !== devToolsOpen) {
      devToolsOpen = isOpenNow;
      onDevToolsDetected?.(devToolsOpen);
    }
  };

  window.addEventListener('contextmenu', handleContextMenu, true);
  window.addEventListener('keydown', handleKeyDown, true);

  const intervalId = setInterval(checkDevTools, 2000);

  // Return Cleanup function
  return () => {
    window.removeEventListener('contextmenu', handleContextMenu, true);
    window.removeEventListener('keydown', handleKeyDown, true);
    clearInterval(intervalId);
  };
}
