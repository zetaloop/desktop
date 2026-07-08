import { HttpStatusCode } from './http-status-code'

export type CopilotPaymentRequiredErrorCode =
  | 'quota_exceeded'
  | 'session_quota_exceeded'
  | 'billing_not_configured'

interface ICopilotErrorOptions {
  readonly paymentRequiredErrorCode?: CopilotPaymentRequiredErrorCode
  readonly retryAfter?: string
}

export interface ICopilotErrorDisplayInfo {
  readonly title: string
  readonly message: string
  readonly retryAfterMessage?: string
  readonly actionText?: string
  readonly actionURL?: string
}

/** An error which contains additional metadata. */
export class CopilotError extends Error {
  /** The error's metadata. */
  private readonly statusCode: number
  private readonly paymentRequiredErrorCode?: CopilotPaymentRequiredErrorCode
  private readonly retryAfterValue?: string

  public constructor(
    message: string,
    statusCode: number,
    options: ICopilotErrorOptions = {}
  ) {
    super(message)

    this.name = 'CopilotError'
    this.statusCode = statusCode
    this.paymentRequiredErrorCode = options.paymentRequiredErrorCode
    this.retryAfterValue = options.retryAfter
  }

  public get isPaymentRequiredError(): boolean {
    return this.statusCode === HttpStatusCode.PaymentRequired
  }

  public get code(): CopilotPaymentRequiredErrorCode | undefined {
    return this.paymentRequiredErrorCode
  }

  public get retryAfter(): string | undefined {
    return this.retryAfterValue
  }
}

const knownPaymentRequiredErrorCodes: ReadonlyArray<CopilotPaymentRequiredErrorCode> =
  ['quota_exceeded', 'session_quota_exceeded', 'billing_not_configured']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function getStringProperty(
  record: Record<string, unknown>,
  key: string
): string | undefined {
  const value = record[key]
  return typeof value === 'string' ? value : undefined
}

function isPaymentRequiredErrorCode(
  value: unknown
): value is CopilotPaymentRequiredErrorCode {
  return (
    typeof value === 'string' &&
    knownPaymentRequiredErrorCodes.some(code => code === value)
  )
}

/**
 * Builds a {@link CopilotError} from a Copilot SDK `session.error` event
 * payload when its upstream HTTP status code is 402 (Payment Required).
 * Returns null for any other status (or no status), so callers can
 * distinguish payment-required failures from generic session errors.
 */
export function getCopilotPaymentRequiredErrorFromSessionError(data: {
  readonly message?: string
  readonly statusCode?: number
  readonly errorCode?: string
}): CopilotError | null {
  if (data.statusCode !== HttpStatusCode.PaymentRequired) {
    return null
  }

  const code = isPaymentRequiredErrorCode(data.errorCode)
    ? data.errorCode
    : undefined
  const cleaned = cleanSessionErrorMessage(data.message ?? '', data.statusCode)
  const message =
    cleaned.length > 0 ? cleaned : getFallbackPaymentRequiredMessage(code)

  return new CopilotError(message, HttpStatusCode.PaymentRequired, {
    paymentRequiredErrorCode: code,
  })
}

/**
 * SDK `session.error` messages are sometimes formatted as
 * `"<statusCode> <message> (Request ID: <id>)"`. Strip the leading status
 * code and trailing request-id annotation so the user sees just the
 * human-readable reason.
 *
 * Exported for testing.
 */
export function cleanSessionErrorMessage(
  message: string,
  statusCode: number
): string {
  return message
    .replace(new RegExp(`^\\s*${statusCode}\\s+`), '')
    .replace(/\s*\(Request ID:[^)]*\)\s*$/i, '')
    .trim()
}

function getFallbackPaymentRequiredMessage(
  code: CopilotPaymentRequiredErrorCode | undefined
) {
  switch (code) {
    case 'quota_exceeded':
      return '您的 GitHub Copilot 用量已达上限。'
    case 'session_quota_exceeded':
      return '您的 GitHub Copilot 会话次数已达上限。'
    case 'billing_not_configured':
      return '此账户未配置 GitHub Copilot 计费。'
    default:
      return 'GitHub Copilot 返回了计费错误。'
  }
}

export function parseCopilotPaymentRequiredError(
  responseText: string,
  retryAfter: string | null
): CopilotError {
  const trimmedResponse = responseText.trim()
  let message = trimmedResponse
  let paymentRequiredErrorCode: CopilotPaymentRequiredErrorCode | undefined

  if (trimmedResponse.length > 0) {
    try {
      const parsed = JSON.parse(trimmedResponse)
      if (isRecord(parsed)) {
        const error = parsed.error
        const topLevelMessage = getStringProperty(parsed, 'message')

        if (isRecord(error)) {
          const errorMessage = getStringProperty(error, 'message')
          const errorCode = getStringProperty(error, 'code')

          if (errorMessage !== undefined && errorMessage.trim().length > 0) {
            message = errorMessage
          } else if (
            topLevelMessage !== undefined &&
            topLevelMessage.trim().length > 0
          ) {
            message = topLevelMessage
          }

          if (isPaymentRequiredErrorCode(errorCode)) {
            paymentRequiredErrorCode = errorCode
          }
        } else if (
          topLevelMessage !== undefined &&
          topLevelMessage.trim().length > 0
        ) {
          message = topLevelMessage
        }
      }
    } catch {
      // Preserve the raw response body when the server doesn't return JSON.
    }
  }

  if (message.length === 0) {
    message = getFallbackPaymentRequiredMessage(paymentRequiredErrorCode)
  }

  return new CopilotError(message, HttpStatusCode.PaymentRequired, {
    paymentRequiredErrorCode,
    retryAfter: retryAfter ?? undefined,
  })
}

function getRetryAfterMessage(retryAfter: string) {
  if (/^\d+$/.test(retryAfter)) {
    const seconds = Number(retryAfter)
    const unit = seconds === 1 ? '秒' : '秒'
    return `请在${seconds}${unit}后再试。`
  }

  return `请在${retryAfter}后再试。`
}

export function getCopilotErrorDisplayInfo(
  error: CopilotError
): ICopilotErrorDisplayInfo | null {
  if (!error.isPaymentRequiredError) {
    return null
  }

  switch (error.code) {
    case 'quota_exceeded':
      return {
        title: '用量已达上限',
        message: error.message,
        retryAfterMessage:
          error.retryAfter !== undefined
            ? getRetryAfterMessage(error.retryAfter)
            : undefined,
      }

    case 'session_quota_exceeded':
      return {
        title: '会话次数已达上限',
        message: error.message,
        retryAfterMessage:
          error.retryAfter !== undefined
            ? getRetryAfterMessage(error.retryAfter)
            : undefined,
      }

    case 'billing_not_configured':
      return {
        title: '未配置 Copilot 计费',
        message: error.message,
        actionText: '打开 GitHub Copilot 设置',
        actionURL: 'https://github.com/settings/copilot',
      }

    default:
      return {
        title: 'Copilot 计费问题',
        message: error.message,
      }
  }
}
