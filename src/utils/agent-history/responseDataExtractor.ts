import { AgentHistoryToolCall } from '../../database/schema'
import { ChatMessage } from '../../types/chat'
import { ToolCallResponseStatus } from '../../types/tool-call.types'

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
    if (
      message.role === 'tool' &&
      'toolCalls' in message &&
      message.toolCalls &&
      Array.isArray(message.toolCalls)
    ) {
      const toolMessage = message
      for (const toolCall of toolMessage.toolCalls) {
        const status = toolCall.response?.status ?? 'success'
        let result_text: string | undefined = undefined

        // Extract result text based on response type
        if (
          status === ToolCallResponseStatus.Success &&
          'data' in toolCall.response
        ) {
          const data = (toolCall.response as any).data
          result_text = typeof data?.text === 'string' ? data.text : undefined
        } else if (
          status === ToolCallResponseStatus.Error &&
          'error' in toolCall.response
        ) {
          result_text = (toolCall.response as any).error
        }

        result.toolCalls!.push({
          name: toolCall.request?.name || 'unknown',
          status: status as any,
          result: result_text,
        })
      }
    }

    // Extract token usage from metadata
    if (
      message.role === 'assistant' &&
      'metadata' in message &&
      message.metadata
    ) {
      const usage = message.metadata.usage
      if (usage) {
        if (usage.prompt_tokens !== undefined) {
          totalInputTokens = usage.prompt_tokens
        }
        if (usage.completion_tokens !== undefined) {
          totalOutputTokens = usage.completion_tokens
        }
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
