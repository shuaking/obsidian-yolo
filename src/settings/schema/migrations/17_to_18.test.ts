import { SETTINGS_SCHEMA_VERSION } from './index'
import { migrateFrom17To18 } from './17_to_18'

describe('migrateFrom17To18', () => {
  it('should migrate version from 17 to 18', () => {
    const data = { version: 17 }
    const result = migrateFrom17To18(data)
    
    expect(result.version).toBe(18)
    expect(SETTINGS_SCHEMA_VERSION).toBe(18)
  })

  it('should migrate legacy assistants to agents', () => {
    const now = Date.now()
    const legacyAssistant = {
      id: 'assistant-1',
      name: 'Test Assistant',
      description: 'A test assistant',
      systemPrompt: 'You are a test assistant.',
      icon: { type: 'emoji', value: '🤖' },
      createdAt: now - 1000,
      updatedAt: now - 500,
    }

    const data = {
      version: 17,
      assistants: [legacyAssistant],
      chatModelId: 'openai/gpt-4.1',
    }

    const result = migrateFrom17To18(data) as any

    expect(result.assistants).toHaveLength(1)
    const migratedAssistant = result.assistants[0]
    
    expect(migratedAssistant.id).toBe('assistant-1')
    expect(migratedAssistant.name).toBe('Test Assistant')
    expect(migratedAssistant.description).toBe('A test assistant')
    expect(migratedAssistant.systemPrompt).toBe('You are a test assistant.')
    expect(migratedAssistant.icon).toEqual({ type: 'emoji', value: '🤖' })
    
    // New required agent fields
    expect(migratedAssistant.modelId).toBe('openai/gpt-4.1')
    expect(migratedAssistant.modelFallback).toBeUndefined()
    expect(migratedAssistant.tools).toEqual([])
    
    // Timestamps preserved
    expect(migratedAssistant.createdAt).toBe(now - 1000)
    expect(migratedAssistant.updatedAt).toBe(now - 500)
  })

  it('should handle missing timestamps gracefully', () => {
    const legacyAssistant = {
      id: 'assistant-1',
      name: 'Test Assistant',
      systemPrompt: 'You are a test assistant.',
    }

    const data = {
      version: 17,
      assistants: [legacyAssistant],
      chatModelId: 'custom/model-id',
    }

    const result = migrateFrom17To18(data) as any
    const migratedAssistant = result.assistants[0]
    
    expect(migratedAssistant.modelId).toBe('custom/model-id')
    expect(migratedAssistant.createdAt).toBeDefined()
    expect(migratedAssistant.updatedAt).toBeDefined()
    expect(migratedAssistant.createdAt).toBe(migratedAssistant.updatedAt)
  })

  it('should handle empty assistants array', () => {
    const data = {
      version: 17,
      assistants: [],
    }

    const result = migrateFrom17To18(data)

    expect(result.assistants).toEqual([])
    expect(result.version).toBe(18)
  })

  it('should handle missing assistants property', () => {
    const data = {
      version: 17,
    }

    const result = migrateFrom17To18(data)

    expect(result.assistants).toBeUndefined()
    expect(result.version).toBe(18)
  })

  it('should use DEFAULT_CHAT_MODEL_ID as fallback when chatModelId is missing', () => {
    const legacyAssistant = {
      id: 'assistant-1',
      name: 'Test Assistant',
      systemPrompt: 'You are a test assistant.',
    }

    const data = {
      version: 17,
      assistants: [legacyAssistant],
      // chatModelId is missing
    }

    const result = migrateFrom17To18(data) as any
    const migratedAssistant = result.assistants[0]
    
    expect(migratedAssistant.modelId).toBe('openai/gpt-5')
  })

  it('should preserve currentAssistantId when possible', () => {
    const data = {
      version: 17,
      assistants: [
        {
          id: 'assistant-1',
          name: 'Test Assistant',
          systemPrompt: 'You are a test assistant.',
        },
      ],
      currentAssistantId: 'assistant-1',
    }

    const result = migrateFrom17To18(data)

    expect(result.currentAssistantId).toBe('assistant-1')
  })

  it('should preserve other properties unchanged', () => {
    const data = {
      version: 17,
      chatModelId: 'openai/gpt-4.1',
      systemPrompt: 'Custom system prompt',
      language: 'zh',
      customProperty: 'should be preserved',
    }

    const result = migrateFrom17To18(data)

    expect(result.chatModelId).toBe('openai/gpt-4.1')
    expect(result.systemPrompt).toBe('Custom system prompt')
    expect(result.language).toBe('zh')
    expect(result.customProperty).toBe('should be preserved')
  })
})