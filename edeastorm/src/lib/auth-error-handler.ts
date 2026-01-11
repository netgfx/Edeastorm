/**
 * Custom error handler for NextAuth authentication errors
 * Provides better error messages and retry logic for common issues
 */

export interface AuthErrorDetails {
  name: string;
  message: string;
  code?: string;
  provider?: string;
  cause?: any;
}

export class AuthErrorHandler {
  /**
   * Check if an error is a network timeout error
   */
  static isTimeoutError(error: any): boolean {
    const timeoutCodes = [
      "UND_ERR_CONNECT_TIMEOUT",
      "ETIMEDOUT",
      "ECONNRESET",
      "ECONNREFUSED",
    ];

    const timeoutMessages = [
      "timeout",
      "timed out",
      "connect timeout",
      "fetch failed",
    ];

    // Check error code
    if (error?.code && timeoutCodes.includes(error.code)) {
      return true;
    }

    // Check error name
    if (
      error?.name === "ConnectTimeoutError" ||
      error?.name === "TimeoutError"
    ) {
      return true;
    }

    // Check error message
    const errorMessage = (error?.message || "").toLowerCase();
    return timeoutMessages.some((msg) => errorMessage.includes(msg));
  }

  /**
   * Check if an error is recoverable (can be retried)
   */
  static isRecoverableError(error: any): boolean {
    return this.isTimeoutError(error);
  }

  /**
   * Get user-friendly error message
   */
  static getUserMessage(error: any): string {
    if (this.isTimeoutError(error)) {
      return "The authentication service took too long to respond. Please try again.";
    }

    if (error?.message?.includes("Configuration")) {
      return "There was a temporary issue connecting to the authentication service. Please try again.";
    }

    if (error?.message?.includes("AccessDenied")) {
      return "Access was denied. Please check your permissions.";
    }

    return "An error occurred during authentication. Please try again.";
  }

  /**
   * Get redirect URL for error
   */
  static getRedirectUrl(error: any, callbackUrl?: string): string {
    if (
      this.isTimeoutError(error) ||
      error?.message?.includes("Configuration")
    ) {
      // For timeout errors, redirect back to signin with retry flag
      const params = new URLSearchParams();
      params.set("retry", "true");
      if (callbackUrl) {
        params.set("callbackUrl", callbackUrl);
      }
      return `/auth/signin?${params.toString()}`;
    }

    // For other errors, go to error page
    const params = new URLSearchParams();
    params.set("error", error?.message || "Default");
    if (callbackUrl) {
      params.set("callbackUrl", callbackUrl);
    }
    return `/auth/error?${params.toString()}`;
  }

  /**
   * Log error details for debugging
   */
  static logError(error: any, context: string = "Auth"): void {
    console.error(`[${context}] Authentication Error:`, {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      provider: error?.provider,
      isTimeout: this.isTimeoutError(error),
      isRecoverable: this.isRecoverableError(error),
      cause: error?.cause,
      stack: error?.stack,
    });
  }
}
