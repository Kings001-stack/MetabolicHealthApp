import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthService from './AuthService';
import ErrorHandler, { ErrorType, ErrorSeverity } from '../error/ErrorHandler';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface ApiRequest {
  endpoint: string;
  method: string;
  timestamp: number;
  userId?: string;
  success: boolean;
}

export class ApiSecurity {
  private static requestLog: Map<string, ApiRequest[]> = new Map();
  
  // Default rate limit configurations
  private static rateLimits: Map<string, RateLimitConfig> = new Map([
    ['health-data', { windowMs: 60000, maxRequests: 30 }], // 30 requests per minute for health data
    ['auth', { windowMs: 300000, maxRequests: 5 }], // 5 auth attempts per 5 minutes
    ['export', { windowMs: 3600000, maxRequests: 3 }], // 3 exports per hour
    ['backup', { windowMs: 3600000, maxRequests: 2 }], // 2 backups per hour
    ['default', { windowMs: 60000, maxRequests: 100 }], // Default: 100 requests per minute
  ]);

  // Check rate limit for API endpoint
  static async checkRateLimit(
    endpoint: string,
    userId: string,
    category: string = 'default'
  ): Promise<boolean> {
    try {
      const config = this.rateLimits.get(category) || this.rateLimits.get('default')!;
      const key = `${userId}_${category}`;
      const now = Date.now();
      
      // Get existing requests for this user/category
      const requests = this.getRequestHistory(key);
      
      // Filter requests within the time window
      const windowStart = now - config.windowMs;
      const recentRequests = requests.filter(req => req.timestamp > windowStart);
      
      // Check if limit exceeded
      if (recentRequests.length >= config.maxRequests) {
        await this.logRateLimitViolation(endpoint, userId, category);
        return false;
      }
      
      return true;
    } catch (error) {
      ErrorHandler.createError(
        ErrorType.RATE_LIMIT,
        `Rate limit check failed: ${error.message}`,
        ErrorSeverity.MEDIUM,
        { endpoint, userId, category }
      );
      return true; // Allow request on error to avoid blocking legitimate users
    }
  }

  // Record API request
  static async recordApiRequest(
    endpoint: string,
    method: string,
    userId: string,
    success: boolean,
    category: string = 'default'
  ): Promise<void> {
    try {
      const key = `${userId}_${category}`;
      const request: ApiRequest = {
        endpoint,
        method,
        timestamp: Date.now(),
        userId,
        success,
      };

      // Add to request history
      const requests = this.getRequestHistory(key);
      requests.push(request);
      
      // Keep only recent requests (last 24 hours)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recentRequests = requests.filter(req => req.timestamp > oneDayAgo);
      
      this.requestLog.set(key, recentRequests);

      // Log suspicious activity
      await this.detectSuspiciousActivity(userId, recentRequests);
      
    } catch (error) {
      ErrorHandler.createError(
        ErrorType.UNKNOWN,
        `Failed to record API request: ${error.message}`,
        ErrorSeverity.LOW
      );
    }
  }

  // Validate API request headers and parameters
  static validateApiRequest(
    endpoint: string,
    method: string,
    headers: Record<string, string>,
    params?: any
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required headers
    if (!headers['Content-Type']) {
      errors.push('Missing Content-Type header');
    }

    if (!headers['User-Agent']) {
      errors.push('Missing User-Agent header');
    }

    // Validate content type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      const contentType = headers['Content-Type'];
      if (!contentType || !contentType.includes('application/json')) {
        errors.push('Invalid Content-Type for request with body');
      }
    }

    // Check for suspicious headers
    const suspiciousHeaders = ['X-Forwarded-For', 'X-Real-IP', 'X-Originating-IP'];
    suspiciousHeaders.forEach(header => {
      if (headers[header]) {
        errors.push(`Suspicious header detected: ${header}`);
      }
    });

    // Validate parameters if provided
    if (params) {
      const validationResult = this.validateRequestParameters(params);
      errors.push(...validationResult.errors);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Validate request parameters for common attacks
  private static validateRequestParameters(params: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /('|(\\')|(;)|(--)|(\|)|(\*)|(%)|(<)|(>)|(\{)|(\})|(\[)|(\]))/,
    ];

    // Check for XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
    ];

    // Check for path traversal
    const pathTraversalPatterns = [
      /\.\.\//g,
      /\.\.\\g,
      /%2e%2e%2f/gi,
      /%2e%2e%5c/gi,
    ];

    const checkPatterns = (value: string, patterns: RegExp[], type: string) => {
      patterns.forEach(pattern => {
        if (pattern.test(value)) {
          errors.push(`Potential ${type} attack detected in parameter`);
        }
      });
    };

    // Recursively check all string values
    const checkValue = (value: any, path: string = '') => {
      if (typeof value === 'string') {
        checkPatterns(value, sqlPatterns, 'SQL injection');
        checkPatterns(value, xssPatterns, 'XSS');
        checkPatterns(value, pathTraversalPatterns, 'path traversal');
        
        // Check for excessively long strings
        if (value.length > 10000) {
          errors.push(`Parameter too long: ${path}`);
        }
      } else if (typeof value === 'object' && value !== null) {
        Object.keys(value).forEach(key => {
          checkValue(value[key], path ? `${path}.${key}` : key);
        });
      }
    };

    checkValue(params);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Detect suspicious activity patterns
  private static async detectSuspiciousActivity(
    userId: string,
    requests: ApiRequest[]
  ): Promise<void> {
    try {
      const now = Date.now();
      const lastHour = requests.filter(req => now - req.timestamp < 3600000);
      const lastMinute = requests.filter(req => now - req.timestamp < 60000);

      // Check for rapid-fire requests
      if (lastMinute.length > 50) {
        await AuthService.logSecurityEvent('suspicious_rapid_requests', {
          userId,
          requestCount: lastMinute.length,
          timeWindow: '1 minute',
        });
      }

      // Check for high failure rate
      const failedRequests = lastHour.filter(req => !req.success);
      const failureRate = failedRequests.length / lastHour.length;
      
      if (lastHour.length > 10 && failureRate > 0.5) {
        await AuthService.logSecurityEvent('high_failure_rate', {
          userId,
          failureRate,
          totalRequests: lastHour.length,
          failedRequests: failedRequests.length,
        });
      }

      // Check for unusual endpoint access patterns
      const uniqueEndpoints = new Set(lastHour.map(req => req.endpoint));
      if (uniqueEndpoints.size > 20) {
        await AuthService.logSecurityEvent('unusual_endpoint_access', {
          userId,
          uniqueEndpoints: uniqueEndpoints.size,
          timeWindow: '1 hour',
        });
      }

    } catch (error) {
      ErrorHandler.createError(
        ErrorType.UNKNOWN,
        `Failed to detect suspicious activity: ${error.message}`,
        ErrorSeverity.LOW
      );
    }
  }

  // Log rate limit violations
  private static async logRateLimitViolation(
    endpoint: string,
    userId: string,
    category: string
  ): Promise<void> {
    await AuthService.logSecurityEvent('rate_limit_exceeded', {
      endpoint,
      userId,
      category,
      timestamp: new Date().toISOString(),
    });

    ErrorHandler.createError(
      ErrorType.RATE_LIMIT,
      `Rate limit exceeded for ${category} category`,
      ErrorSeverity.MEDIUM,
      { endpoint, userId, category }
    );
  }

  // Get request history for a key
  private static getRequestHistory(key: string): ApiRequest[] {
    return this.requestLog.get(key) || [];
  }

  // Get API usage statistics
  static getApiUsageStats(userId: string): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    requestsByCategory: Record<string, number>;
    recentActivity: ApiRequest[];
  } {
    const allRequests: ApiRequest[] = [];
    const requestsByCategory: Record<string, number> = {};

    // Collect all requests for this user
    this.requestLog.forEach((requests, key) => {
      if (key.startsWith(userId)) {
        const category = key.split('_').slice(1).join('_');
        requestsByCategory[category] = requests.length;
        allRequests.push(...requests);
      }
    });

    const successfulRequests = allRequests.filter(req => req.success).length;
    const failedRequests = allRequests.length - successfulRequests;

    // Get recent activity (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentActivity = allRequests
      .filter(req => req.timestamp > oneDayAgo)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);

    return {
      totalRequests: allRequests.length,
      successfulRequests,
      failedRequests,
      requestsByCategory,
      recentActivity,
    };
  }

  // Clear old request logs
  static cleanupOldLogs(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    
    this.requestLog.forEach((requests, key) => {
      const recentRequests = requests.filter(req => req.timestamp > oneDayAgo);
      if (recentRequests.length === 0) {
        this.requestLog.delete(key);
      } else {
        this.requestLog.set(key, recentRequests);
      }
    });
  }

  // Configure custom rate limits
  static setRateLimit(category: string, config: RateLimitConfig): void {
    this.rateLimits.set(category, config);
  }
}

export default ApiSecurity;
