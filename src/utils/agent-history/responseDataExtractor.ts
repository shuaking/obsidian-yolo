import { ChatMessage } from '../../types/chat'
import { AgentHistoryToolCall } from '../../database/schema'

export type ResponseData = {
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number
  toolCalls?: AgentHistoryToolCall[]
}

export function extractResponseData(messages: ChatMessage[]): ResponseData {
  const result: ResponseData = {
    toolCalls: [],
  }

  let totalInputTokens = 0
  let totalOutputTokens = 0

  for (const message of messages) {
    // Count tool calls
    if (message.role === 'tool' && message.toolCalls && Array.isArray(message.toolCalls)) {
      for (const toolCall of message.toolCalls) {
        const status =
          typeof toolCall.response?.status === 'string'
            ? toolCall.response.status.toLowerCase()
            : 'success'

        result.toolCalls!.push({
          name: toolCall.request?.name || 'unknown',
          status: status as any,
          result: typeof toolCall.response?.output === 'string'
            ? toolCall.response.output
            : undefined,
        })
      }
    }

    // Extract token usage from usage metadata
    if (message.usage) {
      if (message.usage.input_tokens !== undefined) {
        totalInputTokens = message.usage.input_tokens
      }
      if (message.usage.output_tokens !== undefined) {
        totalOutputTokens = message.usage.output_tokens
      }
    }
  }

  result.inputTokens = totalInputTokens > 0 ? totalInputTokens : undefined
  result.outputTokens = totalOutputTokens > 0 ? totalOutputTokens : undefined
  result.totalTokens =
    totalInputTokens > 0 || totalOutputTokens > 0
      ? totalInputTokens + totalOutputTokens
      : undefined

  return result
}
