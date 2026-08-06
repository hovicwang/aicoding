/**
 * Service 层统一返回类型：错误以值的形式返回，避免 throw 导致调用方遗漏处理。
 * 后端接入后保持同一契约，UI 无需改动。
 */
export type Result<T, E = ServiceError> =
  | { ok: true; data: T }
  | { ok: false; error: E };

export interface ServiceError {
  code: string;
  message: string;
  /** 是否值得重试（网络波动/服务端 5xx 可重试；参数错误/未授权不重试） */
  retryable: boolean;
}

export const ok = <T>(data: T): Result<T, never> => ({ ok: true, data });
export const err = (
  code: string,
  message: string,
  retryable = false,
): Result<never, ServiceError> => ({
  ok: false,
  error: { code, message, retryable },
});

/** 常用错误码 */
export const ERROR_CODES = {
  NETWORK: "NETWORK",
  UNAUTHORIZED: "UNAUTHORIZED",
  VALIDATION: "VALIDATION",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMIT: "RATE_LIMIT",
  INTERNAL: "INTERNAL",
} as const;
