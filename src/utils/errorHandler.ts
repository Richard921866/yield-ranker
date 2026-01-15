/**
 * Global error handler for unhandled promise rejections and errors
 * Prevents white page crashes from module loading failures
 */

// Custom event for showing error dialogs from outside React
export const ERROR_DIALOG_EVENT = 'showErrorDialog';

interface ErrorDialogData {
  title: string;
  message: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onResume?: () => void;
  showResume?: boolean;
}

// Save current app state to localStorage
function saveAppState() {
  try {
    const state = {
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      timestamp: Date.now(),
      scrollY: window.scrollY,
    };
    localStorage.setItem('app_recovery_state', JSON.stringify(state));
  } catch (e) {
    console.warn('[Error Handler] Failed to save app state:', e);
  }
}

// Restore app state from localStorage
export function restoreAppState(): boolean {
  try {
    const saved = localStorage.getItem('app_recovery_state');
    if (!saved) return false;

    const state = JSON.parse(saved);
    const age = Date.now() - (state.timestamp || 0);

    // Only restore if state is less than 5 minutes old
    if (age > 5 * 60 * 1000) {
      localStorage.removeItem('app_recovery_state');
      return false;
    }

    // Restore scroll position after navigation
    if (state.scrollY) {
      setTimeout(() => {
        window.scrollTo(0, state.scrollY);
      }, 100);
    }

    return true;
  } catch (e) {
    console.warn('[Error Handler] Failed to restore app state:', e);
    return false;
  }
}

// Save state periodically and before navigation
let saveInterval: number | null = null;

function startStateSaving() {
  // Save state every 10 seconds
  saveInterval = window.setInterval(() => {
    saveAppState();
  }, 10000);

  // Save state before page unload
  window.addEventListener('beforeunload', saveAppState);

  // Save state on navigation
  window.addEventListener('popstate', saveAppState);
}

function stopStateSaving() {
  if (saveInterval !== null) {
    clearInterval(saveInterval);
    saveInterval = null;
  }
  window.removeEventListener('beforeunload', saveAppState);
  window.removeEventListener('popstate', saveAppState);
}

export function showErrorDialog(data: ErrorDialogData) {
  window.dispatchEvent(
    new CustomEvent(ERROR_DIALOG_EVENT, { detail: data })
  );
}

// Retry failed module loads
async function retryModuleLoad(maxRetries = 3, delay = 1000): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      // Attempt to reload the page
      await new Promise(resolve => setTimeout(resolve, delay));
      return true;
    } catch (e) {
      console.warn(`[Error Handler] Retry attempt ${i + 1} failed:`, e);
      if (i === maxRetries - 1) return false;
    }
  }
  return false;
}

function isModuleOrNetworkError(error: any): boolean {
  if (!error) return false;

  const errorMessage = error?.message || '';
  const errorName = error?.name || '';

  // Check for various types of loading errors
  return (
    errorMessage.includes("Failed to fetch dynamically imported module") ||
    errorMessage.includes("Failed to load module script") ||
    errorMessage.includes("MIME type") ||
    errorMessage.includes("Failed to fetch") ||
    errorMessage.includes("NetworkError") ||
    errorMessage.includes("Load failed") ||
    errorMessage.includes("Loading chunk") ||
    errorMessage.includes("ChunkLoadError") ||
    errorMessage.includes("Loading CSS chunk") ||
    errorName === "ChunkLoadError" ||
    errorName === "NetworkError" ||
    errorName === "TypeError" && errorMessage.includes("fetch") ||
    (typeof errorMessage === "string" &&
      errorMessage.includes("Expected a JavaScript-or-Wasm module script")) ||
    // Network errors
    (error?.status !== undefined && error.status >= 400) ||
    // CORS or network issues
    (errorMessage.includes("CORS") || errorMessage.includes("network"))
  );
}

export function setupGlobalErrorHandlers() {
  // Store reference to window to avoid TypeScript narrowing issues in closures
  const globalWindow = window;

  // Start saving app state
  startStateSaving();

  // Save state before any navigation or error
  saveAppState();

  // Track if we've already shown an error dialog to prevent spam
  let errorDialogShown = false;
  let lastErrorTime = 0;
  let silentRetryCount = 0;
  const ERROR_COOLDOWN = 5000; // 5 seconds cooldown between error dialogs
  const MAX_SILENT_RETRIES = 2; // Try silent retry before showing error

  // Handle unhandled promise rejections (like failed module imports)
  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason;

    // Check if it's a module or network loading error
    const isError = isModuleOrNetworkError(error);

    if (isError) {
      console.error("[Global Error Handler] Loading error detected:", error);

      // Prevent default error handling
      event.preventDefault();

      // Save state before showing error
      saveAppState();

      // Try silent automatic recovery first (up to MAX_SILENT_RETRIES times)
      const now = Date.now();
      if (silentRetryCount < MAX_SILENT_RETRIES && (now - lastErrorTime) > 1000) {
        silentRetryCount++;
        console.log(`[Global Error Handler] Attempting silent recovery (attempt ${silentRetryCount}/${MAX_SILENT_RETRIES})`);
        // Try automatic recovery: clear cache and reload silently
        setTimeout(() => {
          if ("caches" in window) {
            caches.keys().then((names) => {
              names.forEach((name) => {
                caches.delete(name);
              });
              globalWindow.location.reload();
            }).catch(() => {
              globalWindow.location.reload();
            });
          } else {
            globalWindow.location.reload();
          }
        }, 1000);
        lastErrorTime = now;
        return;
      }

      // Reset silent retry count after cooldown
      if ((now - lastErrorTime) > ERROR_COOLDOWN) {
        silentRetryCount = 0;
      }

      // If silent retries failed, check if we should show dialog
      if (errorDialogShown && (now - lastErrorTime) < ERROR_COOLDOWN) {
        console.log("[Global Error Handler] Error dialog recently shown, attempting automatic recovery");
        // Try automatic recovery: clear cache and reload after a short delay
        setTimeout(() => {
          if ("caches" in window) {
            caches.keys().then((names) => {
              names.forEach((name) => {
                caches.delete(name);
              });
              globalWindow.location.reload();
            }).catch(() => {
              globalWindow.location.reload();
            });
          } else {
            globalWindow.location.reload();
          }
        }, 2000);
        return;
      }

      errorDialogShown = true;
      lastErrorTime = now;
      silentRetryCount = 0; // Reset on showing dialog

      // Reset flag after cooldown
      setTimeout(() => {
        errorDialogShown = false;
      }, ERROR_COOLDOWN);

      // Show user-friendly dialog via custom event with resume option
      showErrorDialog({
        title: "Page Loading Error",
        message: "A required resource failed to load. This can happen due to network issues or after a deployment.\n\nWould you like to:\n• Reload the page (recommended)\n• Try to resume where you were\n• Continue anyway",
        onConfirm: () => {
          errorDialogShown = false;
          // Clear cache and reload
          stopStateSaving();
          if ("caches" in window) {
            caches.keys().then((names) => {
              names.forEach((name) => {
                caches.delete(name);
              });
              setTimeout(() => globalWindow.location.reload(), 500);
            }).catch(() => {
              globalWindow.location.reload();
            });
          } else {
            globalWindow.location.reload();
          }
        },
        onResume: () => {
          errorDialogShown = false;
          // Try to restore state and continue
          const restored = restoreAppState();
          console.log("[Global Error Handler] Attempting to resume:", restored);
          // Don't reload, just let the app continue
        },
        onCancel: () => {
          errorDialogShown = false;
          // User wants to continue anyway
          console.warn("[Global Error Handler] User chose to continue");
        },
        showResume: true,
      });
    } else {
      // Log other errors but don't prevent default handling
      console.error("[Global Error Handler] Unhandled promise rejection:", error);
    }
  });

  // Track error dialog state for script errors too
  let scriptErrorDialogShown = false;
  let lastScriptErrorTime = 0;

  // Handle general errors (including script loading errors)
  window.addEventListener("error", (event) => {
    const error = event.error || event;
    const isChunkError = event.message?.includes("Loading chunk") ||
      event.message?.includes("ChunkLoadError") ||
      event.message?.includes("Failed to load") ||
      (event.target && (event.target as any).tagName === "SCRIPT" &&
        (event.target as any).src &&
        (event.target as any).src.includes(".js"));

    // Check if it's a module or network loading error
    const isError = isModuleOrNetworkError(error) || isChunkError;

    if (isError && !event.error && isChunkError) {
      // Script/chunk loading error - try automatic recovery first
      console.error("[Global Error Handler] Chunk/Script loading error detected:", event.message);
      event.preventDefault();

      // Save state before recovery
      saveAppState();

      const now = Date.now();
      if (scriptErrorDialogShown && (now - lastScriptErrorTime) < ERROR_COOLDOWN) {
        // Automatic recovery: clear cache and reload
        console.log("[Global Error Handler] Attempting automatic recovery for chunk error");
        setTimeout(() => {
          if ("caches" in window) {
            caches.keys().then((names) => {
              names.forEach((name) => {
                caches.delete(name);
              });
              globalWindow.location.reload();
            }).catch(() => {
              globalWindow.location.reload();
            });
          } else {
            globalWindow.location.reload();
          }
        }, 1000);
        return;
      }

      scriptErrorDialogShown = true;
      lastScriptErrorTime = now;

      setTimeout(() => {
        scriptErrorDialogShown = false;
      }, ERROR_COOLDOWN);

      showErrorDialog({
        title: "Page Loading Error",
        message: "A script or module failed to load. This often happens after a deployment or due to network issues.\n\nWould you like to reload the page to get the latest version?",
        onConfirm: () => {
          scriptErrorDialogShown = false;
          stopStateSaving();
          if ("caches" in window) {
            caches.keys().then((names) => {
              names.forEach((name) => {
                caches.delete(name);
              });
              setTimeout(() => globalWindow.location.reload(), 500);
            }).catch(() => {
              globalWindow.location.reload();
            });
          } else {
            globalWindow.location.reload();
          }
        },
        onResume: () => {
          scriptErrorDialogShown = false;
          restoreAppState();
        },
        showResume: true,
      });
    } else if (isModuleOrNetworkError(error)) {
      console.error("[Global Error Handler] Error detected:", error);
      event.preventDefault();
      saveAppState();

      // For critical errors, attempt automatic recovery silently first
      if (error?.name === "ChunkLoadError" ||
        (typeof error?.message === "string" && error.message.includes("chunk"))) {
        // Try silent recovery first
        if (silentRetryCount < MAX_SILENT_RETRIES) {
          silentRetryCount++;
          console.log(`[Global Error Handler] Silent recovery for chunk error (attempt ${silentRetryCount}/${MAX_SILENT_RETRIES})`);
          setTimeout(() => {
            if ("caches" in window) {
              caches.keys().then((names) => {
                names.forEach((name) => {
                  caches.delete(name);
                });
                globalWindow.location.reload();
              }).catch(() => {
                globalWindow.location.reload();
              });
            } else {
              globalWindow.location.reload();
            }
          }, 1000);
        } else {
          // After max retries, wait longer before showing error
          setTimeout(() => {
            if ("caches" in window) {
              caches.keys().then((names) => {
                names.forEach((name) => {
                  caches.delete(name);
                });
                globalWindow.location.reload();
              }).catch(() => {
                globalWindow.location.reload();
              });
            }
          }, 2000);
        }
      }
    }
  }, true); // Use capture phase to catch all errors

  // Handle network offline/online events
  window.addEventListener("online", () => {
    console.log("[Global Error Handler] Network back online");
    // Try to restore state if we had an error
    restoreAppState();
  });

  window.addEventListener("offline", () => {
    console.warn("[Global Error Handler] Network went offline");
    saveAppState();
  });
}

