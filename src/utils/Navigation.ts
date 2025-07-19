export class Navigation {
  /**
   * Navigate to a specific route
   */
  static navigate(path: string): void {
    // For now, just reload the page or use simple routing
    // You can expand this based on your routing needs
    if (path.startsWith("/")) {
      window.location.pathname = path;
    } else {
      window.location.href = path;
    }
  }

  /**
   * Reload the current page
   */
  static reload(): void {
    window.location.reload();
  }

  /**
   * Go back in history
   */
  static back(): void {
    window.history.back();
  }

  /**
   * Replace current URL without navigation
   */
  static replaceUrl(path: string): void {
    window.history.replaceState({}, "", path);
  }
}

// For backward compatibility
export const ReactInterface = Navigation;
