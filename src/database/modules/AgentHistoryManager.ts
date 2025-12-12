import { and, desc, eq, gte, lte } from 'drizzle-orm'
import { PgliteDatabase } from 'drizzle-orm/pglite'

import { agentHistoryTable, AgentHistoryToolCall, InsertAgentHistory, SelectAgentHistory } from '../schema'

export type AgentHistoryRecord = SelectAgentHistory

export type AgentHistoryFilter = {
  agentId?: string
  surface?: string
  startTime?: number
  endTime?: number
  conversationId?: string
}

export type AgentHistoryStats = {
  totalInvocations: number
  successfulInvocations: number
  failedInvocations: number
  abortedInvocations: number
  averageInputTokens: number
  averageOutputTokens: number
  averageTotalTokens: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTokens: number
  toolUsageRate: number
  failureRate: number
  averageExecutionTime: number
}

export class AgentHistoryManager {
  constructor(private db: PgliteDatabase) {}

  async recordAgentInvocation(record: InsertAgentHistory): Promise<SelectAgentHistory> {
    const result = await this.db
      .insert(agentHistoryTable)
      .values(record)
      .returning()

    return result[0]
  }

  async getAgentHistory(
    filter?: AgentHistoryFilter,
    limit: number = 100,
    offset: number = 0,
  ): Promise<SelectAgentHistory[]> {
    const conditions = []

    if (filter?.agentId) {
      conditions.push(eq(agentHistoryTable.agentId, filter.agentId))
    }
    if (filter?.surface) {
      conditions.push(eq(agentHistoryTable.surface, filter.surface))
    }
    if (filter?.startTime) {
      conditions.push(gte(agentHistoryTable.startTime, filter.startTime))
    }
    if (filter?.endTime) {
      conditions.push(lte(agentHistoryTable.endTime, filter.endTime))
    }
    if (filter?.conversationId) {
      conditions.push(eq(agentHistoryTable.conversationId, filter.conversationId))
    }

    let query = this.db
      .select()
      .from(agentHistoryTable)
      .orderBy(desc(agentHistoryTable.startTime))

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query
    }

    return query.limit(limit).offset(offset)
  }

  async getAgentHistoryCount(filter?: AgentHistoryFilter): Promise<number> {
    const conditions = []

    if (filter?.agentId) {
      conditions.push(eq(agentHistoryTable.agentId, filter.agentId))
    }
    if (filter?.surface) {
      conditions.push(eq(agentHistoryTable.surface, filter.surface))
    }
    if (filter?.startTime) {
      conditions.push(gte(agentHistoryTable.startTime, filter.startTime))
    }
    if (filter?.endTime) {
      conditions.push(lte(agentHistoryTable.endTime, filter.endTime))
    }
    if (filter?.conversationId) {
      conditions.push(eq(agentHistoryTable.conversationId, filter.conversationId))
    }

    let query = this.db
      .select({ count: agentHistoryTable.id })
      .from(agentHistoryTable)

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query
    }

    const result = await query

    return result.length > 0 ? result.length : 0
  }

  async getAgentHistoryStats(filter?: AgentHistoryFilter): Promise<AgentHistoryStats> {
    const records = await this.getAgentHistory(filter, 10000, 0)

    if (records.length === 0) {
      return {
        totalInvocations: 0,
        successfulInvocations: 0,
        failedInvocations: 0,
        abortedInvocations: 0,
        averageInputTokens: 0,
        averageOutputTokens: 0,
        averageTotalTokens: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        toolUsageRate: 0,
        failureRate: 0,
        averageExecutionTime: 0,
      }
    }

    const totalInvocations = records.length
    const successfulInvocations = records.filter((r) => r.success === 'success').length
    const failedInvocations = records.filter((r) => r.success === 'error').length
    const abortedInvocations = records.filter((r) => r.success === 'aborted').length

    const totalInputTokens = records.reduce((sum, r) => sum + (r.inputTokens || 0), 0)
    const totalOutputTokens = records.reduce((sum, r) => sum + (r.outputTokens || 0), 0)
    const totalTokens = records.reduce((sum, r) => sum + (r.totalTokens || 0), 0)

    const recordsWithTokens = records.filter((r) => r.inputTokens !== null && r.inputTokens !== undefined)
    const averageInputTokens = recordsWithTokens.length > 0 ? totalInputTokens / recordsWithTokens.length : 0
    const averageOutputTokens = recordsWithTokens.length > 0 ? totalOutputTokens / recordsWithTokens.length : 0
    const averageTotalTokens = recordsWithTokens.length > 0 ? totalTokens / recordsWithTokens.length : 0

    const recordsWithToolCalls = records.filter((r) => r.toolCalls && r.toolCalls.length > 0)
    const toolUsageRate = recordsWithToolCalls.length / totalInvocations

    const failureRate = failedInvocations / totalInvocations

    const averageExecutionTime =
      records.reduce((sum, r) => sum + (r.endTime - r.startTime), 0) / totalInvocations

    return {
      totalInvocations,
      successfulInvocations,
      failedInvocations,
      abortedInvocations,
      averageInputTokens: Math.round(averageInputTokens),
      averageOutputTokens: Math.round(averageOutputTokens),
      averageTotalTokens: Math.round(averageTotalTokens),
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      toolUsageRate,
      failureRate,
      averageExecutionTime: Math.round(averageExecutionTime),
    }
  }

  async deleteAgentHistory(filter?: AgentHistoryFilter): Promise<number> {
    const conditions = []

    if (filter?.agentId) {
      conditions.push(eq(agentHistoryTable.agentId, filter.agentId))
    }
    if (filter?.surface) {
      conditions.push(eq(agentHistoryTable.surface, filter.surface))
    }
    if (filter?.startTime) {
      conditions.push(gte(agentHistoryTable.startTime, filter.startTime))
    }
    if (filter?.endTime) {
      conditions.push(lte(agentHistoryTable.endTime, filter.endTime))
    }
    if (filter?.conversationId) {
      conditions.push(eq(agentHistoryTable.conversationId, filter.conversationId))
    }

    let query = this.db.delete(agentHistoryTable)

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query
    }

    await query

    return 0 // Drizzle doesn't return affected rows count directly
  }
}
