import { DEFAULT_CHAT_MODEL_ID } from '../../../constants'
import { SettingMigration } from '../setting.types'
import { legacyAssistantSchema } from '../../../types/assistant.types'

export const migrateFrom17To18: SettingMigration['migrate'] = (data) => {
  const newData = { ...data }
  newData.version = 18

  // Migrate legacy assistants to agents by adding new required fields
  if (Array.isArray(newData.assistants)) {
    const now = Date.now()
    newData.assistants = newData.assistants.map((assistant: any) => {
      // Validate legacy assistant structure
      const legacyAssistant = legacyAssistantSchema.parse(assistant)
      
      // Create agent with new required fields and sensible defaults
      return {
        ...legacyAssistant,
        // Add required agent-specific fields with defaults
        modelId: assistant.modelId || newData.chatModelId || DEFAULT_CHAT_MODEL_ID,
        modelFallback: assistant.modelFallback || undefined,
        tools: assistant.tools || [],
        
        // Ensure timestamps exist (required for agents)
        createdAt: legacyAssistant.createdAt || now,
        updatedAt: legacyAssistant.updatedAt || now,
      }
    })
  }

  return newData
}