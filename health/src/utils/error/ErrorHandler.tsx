import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AuthService from "../security/AuthService";

export enum ErrorType {
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  DATABASE = "DATABASE",
  NETWORK = "NETWORK",
  ENCRYPTION = "ENCRYPTION",
  BIOMETRIC = "BIOMETRIC",
  RATE_LIMIT = "RATE_LIMIT",
  UNKNOWN = "UNKNOWN",
}

export enum ErrorSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  details?: any;
  timestamp: Date;
  userId?: string;
  stackTrace?: string;
  userFriendlyMessage: string;
}

export class ErrorHandler {
  private static errorLog: AppError[] = [];
  private static readonly MAX_LOG_SIZE = 1000;

  static createError(
    type: ErrorType,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    details?: any
  ): AppError {
    const error: AppError = {
      id: this.generateErrorId(),
      type,
      severity,
      message,
      details,
      timestamp: new Date(),
      stackTrace: new Error().stack,
      userFriendlyMessage: this.getUserFriendlyMessage(type, message),
    };

    this.logError(error);
    return error;
  }

  static handleValidationError(message: string, field?: string): AppError {
    return this.createError(ErrorType.VALIDATION, message, ErrorSeverity.LOW, {
      field,
    });
  }

  static handleAuthenticationError(message: string): AppError {
    return this.createError(
      ErrorType.AUTHENTICATION,
      message,
      ErrorSeverity.HIGH
    );
  }

  static handleDatabaseError(message: string, query?: string): AppError {
    return this.createError(ErrorType.DATABASE, message, ErrorSeverity.HIGH, {
      query,
    });
  }

  static handleNetworkError(message: string, endpoint?: string): AppError {
    return this.createError(ErrorType.NETWORK, message, ErrorSeverity.MEDIUM, {
      endpoint,
    });
  }

  static handleEncryptionError(message: string): AppError {
    return this.createError(
      ErrorType.ENCRYPTION,
      message,
      ErrorSeverity.CRITICAL
    );
  }

  static handleBiometricError(message: string): AppError {
    return this.createError(ErrorType.BIOMETRIC, message, ErrorSeverity.MEDIUM);
  }

  static handleRateLimitError(message: string, action?: string): AppError {
    return this.createError(
      ErrorType.RATE_LIMIT,
      message,
      ErrorSeverity.MEDIUM,
      { action }
    );
  }

  private static async logError(error: AppError): Promise<void> {
    try {
      this.errorLog.push(error);

      if (this.errorLog.length > this.MAX_LOG_SIZE) {
        this.errorLog = this.errorLog.slice(-this.MAX_LOG_SIZE);
      }

      if (
        error.severity === ErrorSeverity.CRITICAL ||
        error.severity === ErrorSeverity.HIGH
      ) {
        await AuthService.logSecurityEvent("critical_error", {
          errorId: error.id,
          type: error.type,
          message: error.message,
          severity: error.severity,
        });
      }

      if (__DEV__) {
        console.error(
          `[${error.severity}] ${error.type}: ${error.message}`,
          error.details
        );
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }
  }

  private static getUserFriendlyMessage(
    type: ErrorType,
    message: string
  ): string {
    switch (type) {
      case ErrorType.VALIDATION:
        return "Please check your input and try again.";
      case ErrorType.AUTHENTICATION:
        return "Please check your credentials and try again.";
      case ErrorType.AUTHORIZATION:
        return "You do not have permission to perform this action.";
      case ErrorType.DATABASE:
        return "There was a problem saving your data. Please try again.";
      case ErrorType.NETWORK:
        return "Please check your internet connection and try again.";
      case ErrorType.ENCRYPTION:
        return "There was a security error. Please contact support.";
      case ErrorType.BIOMETRIC:
        return "Biometric authentication failed. Please try again or use your passcode.";
      case ErrorType.RATE_LIMIT:
        return "Too many attempts. Please wait a moment and try again.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  }

  private static generateErrorId(): string {
    return `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static getErrorStatistics() {
    const byType = {} as Record<ErrorType, number>;
    const bySeverity = {} as Record<ErrorSeverity, number>;

    Object.values(ErrorType).forEach((type) => {
      byType[type] = 0;
    });
    Object.values(ErrorSeverity).forEach((severity) => {
      bySeverity[severity] = 0;
    });

    this.errorLog.forEach((error) => {
      byType[error.type]++;
      bySeverity[error.severity]++;
    });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = this.errorLog.filter((error) => error.timestamp > oneDayAgo);

    return {
      total: this.errorLog.length,
      byType,
      bySeverity,
      recent,
    };
  }

  static clearErrorLog(): void {
    this.errorLog = [];
  }

  static exportErrorLog(): string {
    return JSON.stringify(this.errorLog, null, 2);
  }

  static setupGlobalErrorHandler(): void {
    const originalHandler = (ErrorUtils as any).getGlobalHandler?.();
    (ErrorUtils as any).setGlobalHandler?.((error: any, isFatal: boolean) => {
      this.createError(
        ErrorType.UNKNOWN,
        error.message,
        isFatal ? ErrorSeverity.CRITICAL : ErrorSeverity.HIGH,
        { isFatal, stack: error.stack }
      );

      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });

    process.on?.("unhandledRejection", (reason: any, promise: any) => {
      this.createError(
        ErrorType.UNKNOWN,
        `Unhandled Promise Rejection: ${reason}`,
        ErrorSeverity.HIGH,
        { promise }
      );
    });
  }

  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error as Error;

        this.createError(
          ErrorType.UNKNOWN,
          `Operation failed (attempt ${attempt}/${maxRetries}): ${error.message}`,
          attempt === maxRetries ? ErrorSeverity.HIGH : ErrorSeverity.LOW
        );

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }
    }

    throw lastError!;
  }
}

export const withErrorBoundary = (Component: React.ComponentType<any>) => {
  return class ErrorBoundaryWrapper extends React.Component<
    any,
    { hasError: boolean; error?: AppError }
  > {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error) {
      const appError = ErrorHandler.createError(
        ErrorType.UNKNOWN,
        error.message,
        ErrorSeverity.HIGH,
        { componentStack: error.stack }
      );

      return { hasError: true, error: appError };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      ErrorHandler.createError(
        ErrorType.UNKNOWN,
        error.message,
        ErrorSeverity.HIGH,
        { errorInfo }
      );
    }

    render() {
      if (this.state.hasError) {
        return (
          <View style={styles.container}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.state.error?.userFriendlyMessage}
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => this.setState({ hasError: false })}
            >
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return <Component {...this.props} />;
    }
  };
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default ErrorHandler;
