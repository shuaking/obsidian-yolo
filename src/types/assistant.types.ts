import { z } from 'zod'

// Assistant icon type definition
export const assistantIconSchema = z.object({
  type: z.enum(['lucide', 'emoji']),
  value: z.string(),
})

export type AssistantIcon = z.infer<typeof assistantIconSchema>

// Assistant type definition
export const assistantSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name cannot be empty'),
  description: z.string().optional(),
  systemPrompt: z.string().min(1, 'System prompt cannot be empty'),
  icon: assistantIconSchema.optional(),
  modelId: z.string().optional(), // Chat model ID for this assistant
  tools: z.array(z.string()).optional(), // List of MCP tool names available to this assistant
  createdAt: z.number().optional(),
  updatedAt: z.number().optional(),
})

export type Assistant = z.infer<typeof assistantSchema>
