import { z } from 'zod'

// Assistant icon type definition
export const assistantIconSchema = z.object({
  type: z.enum(['lucide', 'emoji']),
  value: z.string(),
})

export type AssistantIcon = z.infer<typeof assistantIconSchema>

// Agent tool configuration for MCP integration
export const agentToolConfigSchema = z.object({
  serverId: z.string(),
  toolName: z.string(),
  enabled: z.boolean().default(true),
})

export type AgentToolConfig = z.infer<typeof agentToolConfigSchema>

// Agent type definition (extends Assistant with full agent capabilities)
export const assistantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name cannot be empty'),
  description: z.string().optional(),
  systemPrompt: z.string().min(1, 'System prompt cannot be empty'),
  icon: assistantIconSchema.optional(),

  // Agent-specific fields (with defaults for backward compatibility)
  modelId: z.string().optional(),
  modelFallback: z.string().optional(),
  tools: z.array(agentToolConfigSchema).default([]),

  // Timestamps (with defaults for backward compatibility)
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
})

export type Assistant = z.infer<typeof assistantSchema>

// Legacy assistant schema for backward compatibility during migration
export const legacyAssistantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name cannot be empty'),
  description: z.string().optional(),
  systemPrompt: z.string().min(1, 'System prompt cannot be empty'),
  icon: assistantIconSchema.optional(),
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
})

export type LegacyAssistant = z.infer<typeof legacyAssistantSchema>
