import { sql } from 'drizzle-orm'
import {
  bigint,
  customType,
  index,
  jsonb,
  pgTable,
  serial,
  smallint,
  text,
} from 'drizzle-orm/pg-core'
import { z } from 'zod'

// custom vector type for dynamic dimension
const customVector = customType<{ data: number[] }>({
  dataType() {
    return 'vector'
  },
  toDriver(value) {
    return JSON.stringify(value)
  },
  fromDriver(value) {
    if (typeof value !== 'string') {
      throw new Error('Invalid vector value from pg driver')
    }
    const parsed = z.array(z.number()).parse(JSON.parse(value))
    return parsed
  },
})

export type VectorMetaData = {
  startLine: number
  endLine: number
}

// important: dimensions must be less than 2000!
export const supportedDimensionsForIndex = [
  128, 256, 384, 512, 768, 1024, 1280, 1536, 1792,
]

export const embeddingTable = pgTable(
  'embeddings',
  {
    id: serial('id').primaryKey(),
    path: text('path').notNull(), // path to the file
    mtime: bigint('mtime', { mode: 'number' }).notNull(), // mtime of the file
    content: text('content').notNull(), // content of the file
    model: text('model').notNull(), // model id
    dimension: smallint('dimension').notNull(), // dimension of the vector
    embedding: customVector('embedding'), // embedding of the file
    metadata: jsonb('metadata').notNull().$type<VectorMetaData>(),
  },
  (table) => [
    index('embeddings_path_index').on(table.path),
    index('embeddings_model_index').on(table.model),
    index('embeddings_dimension_index').on(table.dimension),
    ...supportedDimensionsForIndex.map((dimension) =>
      // https://github.com/pgvector/pgvector?tab=readme-ov-file#can-i-store-vectors-with-different-dimensions-in-the-same-column
      index(`embeddings_embedding_${dimension}_index`)
        .using(
          'hnsw',
          // use sql.raw for index definition because it shouldn't be parameterized
          sql.raw(
            `(${table.embedding.name}::vector(${dimension})) vector_cosine_ops`,
          ),
        )
        // use sql.raw for index definition because it shouldn't be parameterized
        .where(sql.raw(`${table.dimension.name} = ${dimension}`)),
    ),
  ],
)

export type SelectEmbedding = typeof embeddingTable.$inferSelect
export type InsertEmbedding = typeof embeddingTable.$inferInsert

export type AgentHistoryToolCall = {
  name: string
  status: 'success' | 'error' | 'pending_approval'
  result?: string
}

export const agentHistoryTable = pgTable('agent_history', {
  id: serial('id').primaryKey(),
  agentId: text('agent_id').notNull(), // model ID
  surface: text('surface').notNull(), // 'chat' | 'quick-ask' | 'smart-space'
  conversationId: text('conversation_id'),
  startTime: bigint('start_time', { mode: 'number' }).notNull(),
  endTime: bigint('end_time', { mode: 'number' }).notNull(),
  inputTokens: smallint('input_tokens'),
  outputTokens: smallint('output_tokens'),
  totalTokens: smallint('total_tokens'),
  toolCalls: jsonb('tool_calls').$type<AgentHistoryToolCall[]>(),
  success: text('success').notNull(), // 'success' | 'error' | 'aborted'
  errorMessage: text('error_message'),
}, (table) => [
  index('agent_history_agent_id_index').on(table.agentId),
  index('agent_history_surface_index').on(table.surface),
  index('agent_history_start_time_index').on(table.startTime),
  index('agent_history_conversation_id_index').on(table.conversationId),
])

export type SelectAgentHistory = typeof agentHistoryTable.$inferSelect
export type InsertAgentHistory = typeof agentHistoryTable.$inferInsert

// removed template table
