import { SmartComposerSettings } from '../settings/schema/setting.types'
import { Assistant } from '../types/assistant.types'

export function getActiveAssistant(
  settings: SmartComposerSettings,
): Assistant | null {
  const { currentAssistantId, assistants = [] } = settings
  if (!currentAssistantId) {
    return null
  }
  return (
    assistants.find((assistant) => assistant.id === currentAssistantId) ?? null
  )
}

export function isModelAvailable(
  settings: SmartComposerSettings,
  modelId?: string | null,
): boolean {
  if (!modelId) {
    return false
  }
  return settings.chatModels.some((model) => model.id === modelId)
}

export function resolveChatModelId(
  settings: SmartComposerSettings,
  ...candidateIds: (string | undefined | null)[]
): string {
  const seen = new Set<string>()
  for (const candidate of candidateIds) {
    if (!candidate || seen.has(candidate)) {
      continue
    }
    seen.add(candidate)
    if (isModelAvailable(settings, candidate)) {
      return candidate
    }
  }

  if (isModelAvailable(settings, settings.chatModelId)) {
    return settings.chatModelId
  }

  const fallback = settings.chatModels[0]?.id
  if (fallback) {
    return fallback
  }

  throw new Error('No chat models configured')
}

export function buildAssistantInstructionPrompt(
  settings: SmartComposerSettings,
): string | null {
  const assistant = getActiveAssistant(settings)
  const customInstruction = settings.systemPrompt?.trim()
  const parts: string[] = []

  const assistantPrompt = assistant?.systemPrompt?.trim()
  if (assistantPrompt) {
    const safeName = assistant?.name?.trim() || 'Assistant'
    parts.push(`<assistant_instructions name="${safeName}">
${assistantPrompt}
</assistant_instructions>`)
  }

  if (customInstruction) {
    parts.push(`<custom_instructions>
${customInstruction}
</custom_instructions>`)
  }

  if (parts.length === 0) {
    return null
  }
  return parts.join('\n\n')
}

export function getAssistantToolAllowList(
  settings: SmartComposerSettings,
): string[] | null {
  const assistant = getActiveAssistant(settings)
  return getAssistantToolAllowListFromAssistant(assistant)
}

export function getAssistantToolAllowListFromAssistant(
  assistant?: Assistant | null,
): string[] | null {
  if (!assistant?.tools || assistant.tools.length === 0) {
    return null
  }
  const sanitized = assistant.tools
    .filter((tool) => tool.enabled)
    .map((tool) => `${tool.serverId}/${tool.toolName}`)
    .filter((tool) => tool.length > 0)
  return sanitized.length > 0 ? sanitized : null
}

export function computeAssistantToolStats({
  assistant,
  availableToolNames,
}: {
  assistant: Assistant | null
  availableToolNames: Set<string>
}): {
  available: number
  total: number | null
} {
  const allowList = getAssistantToolAllowListFromAssistant(assistant)
  if (!allowList) {
    return {
      available: availableToolNames.size,
      total: null,
    }
  }

  const available = allowList.reduce((count, toolName) => {
    return count + (availableToolNames.has(toolName) ? 1 : 0)
  }, 0)

  return {
    available,
    total: allowList.length,
  }
}
