import { ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useDatabase } from '../../../contexts/database-context'
import { useLanguage } from '../../../contexts/language-context'
import { AgentHistoryStats } from '../../../database/modules/AgentHistoryManager'
import { SelectAgentHistory as AgentHistoryRecord } from '../../../database/schema'
import {
  downloadFile,
  exportToCSV,
  exportToJSON,
} from '../../../utils/agent-history/exportAgentHistory'
import { ObsidianButton } from '../../common/ObsidianButton'
import { ObsidianSetting } from '../../common/ObsidianSetting'

export function AgentAnalyticsSection() {
  const { t } = useLanguage()
  const { getAgentHistoryManager } = useDatabase()

  const [isLoading, setIsLoading] = useState(false)
  const [records, setRecords] = useState<AgentHistoryRecord[]>([])
  const [stats, setStats] = useState<AgentHistoryStats | null>(null)
  const [expandedRecordId, setExpandedRecordId] = useState<number | null>(null)
  const [filter, setFilter] = useState<{
    agentId?: string
    surface?: string
  }>({})

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const manager = await getAgentHistoryManager()
      const [historyRecords, historyStats] = await Promise.all([
        manager.getAgentHistory(filter, 100, 0),
        manager.getAgentHistoryStats(filter),
      ])
      setRecords(historyRecords)
      setStats(historyStats)
    } catch (err) {
      console.error('Failed to load agent history:', err)
    } finally {
      setIsLoading(false)
    }
  }, [getAgentHistoryManager, filter])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const uniqueAgentIds = useMemo(() => {
    return [...new Set(records.map((r) => r.agentId))]
  }, [records])

  const handleExportCSV = useCallback(async () => {
    try {
      const manager = await getAgentHistoryManager()
      const allRecords = await manager.getAgentHistory(filter, 10000, 0)
      const csv = exportToCSV(allRecords)
      const filename = `agent-history-${new Date().toISOString().split('T')[0]}.csv`
      downloadFile(csv, filename, 'text/csv')
    } catch (err) {
      console.error('Failed to export CSV:', err)
    }
  }, [getAgentHistoryManager, filter])

  const handleExportJSON = useCallback(async () => {
    try {
      const manager = await getAgentHistoryManager()
      const allRecords = await manager.getAgentHistory(filter, 10000, 0)
      const json = exportToJSON(allRecords)
      const filename = `agent-history-${new Date().toISOString().split('T')[0]}.json`
      downloadFile(json, filename, 'application/json')
    } catch (err) {
      console.error('Failed to export JSON:', err)
    }
  }, [getAgentHistoryManager, filter])

  const handleClearHistory = useCallback(async () => {
    if (
      !confirm(
        t('settings.agentAnalytics.clearConfirm') ||
          'Are you sure you want to clear agent history?',
      )
    ) {
      return
    }

    try {
      const manager = await getAgentHistoryManager()
      await manager.deleteAgentHistory(filter)
      setRecords([])
      setStats(null)
    } catch (err) {
      console.error('Failed to clear agent history:', err)
    }
  }, [getAgentHistoryManager, filter, t])

  return (
    <>
      <ObsidianSetting
        name={t('settings.agentAnalytics.name')}
        desc={t('settings.agentAnalytics.desc')}
        heading
        className="smtcmp-settings-agent-analytics"
      />

      {stats && (
        <div className="smtcmp-analytics-stats">
          <div className="smtcmp-stats-grid">
            <div className="smtcmp-stat-card">
              <div className="smtcmp-stat-value">{stats.totalInvocations}</div>
              <div className="smtcmp-stat-label">
                {t('settings.agentAnalytics.totalInvocations')}
              </div>
            </div>
            <div className="smtcmp-stat-card">
              <div className="smtcmp-stat-value">
                {stats.successfulInvocations}
              </div>
              <div className="smtcmp-stat-label">
                {t('settings.agentAnalytics.successful')}
              </div>
            </div>
            <div className="smtcmp-stat-card">
              <div className="smtcmp-stat-value">{stats.failedInvocations}</div>
              <div className="smtcmp-stat-label">
                {t('settings.agentAnalytics.failed')}
              </div>
            </div>
            <div className="smtcmp-stat-card">
              <div className="smtcmp-stat-value">
                {(stats.failureRate * 100).toFixed(1)}%
              </div>
              <div className="smtcmp-stat-label">
                {t('settings.agentAnalytics.failureRate')}
              </div>
            </div>
            <div className="smtcmp-stat-card">
              <div className="smtcmp-stat-value">
                {stats.averageTotalTokens}
              </div>
              <div className="smtcmp-stat-label">
                {t('settings.agentAnalytics.averageTokens')}
              </div>
            </div>
            <div className="smtcmp-stat-card">
              <div className="smtcmp-stat-value">
                {(stats.toolUsageRate * 100).toFixed(1)}%
              </div>
              <div className="smtcmp-stat-label">
                {t('settings.agentAnalytics.toolUsageRate')}
              </div>
            </div>
            <div className="smtcmp-stat-card">
              <div className="smtcmp-stat-value">{stats.totalTokens}</div>
              <div className="smtcmp-stat-label">
                {t('settings.agentAnalytics.totalTokens')}
              </div>
            </div>
            <div className="smtcmp-stat-card">
              <div className="smtcmp-stat-value">
                {Math.round(stats.averageExecutionTime)}ms
              </div>
              <div className="smtcmp-stat-label">
                {t('settings.agentAnalytics.avgExecutionTime')}
              </div>
            </div>
          </div>
        </div>
      )}

      <ObsidianSetting
        name={t('settings.agentAnalytics.filters')}
        className="smtcmp-filters"
      >
        <div className="smtcmp-filters-group">
          <label>
            {t('settings.agentAnalytics.filterByAgent')}:
            <select
              value={filter.agentId || ''}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  agentId: e.target.value || undefined,
                })
              }
              style={{ marginLeft: '8px' }}
            >
              <option value="">All Agents</option>
              {uniqueAgentIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </label>

          <label style={{ marginLeft: '16px' }}>
            {t('settings.agentAnalytics.filterBySurface')}:
            <select
              value={filter.surface || ''}
              onChange={(e) =>
                setFilter({
                  ...filter,
                  surface: e.target.value || undefined,
                })
              }
              style={{ marginLeft: '8px' }}
            >
              <option value="">All Surfaces</option>
              <option value="chat">Chat</option>
              <option value="quick-ask">Quick Ask</option>
              <option value="smart-space">Smart Space</option>
            </select>
          </label>
        </div>
      </ObsidianSetting>

      <ObsidianSetting
        name={t('settings.agentAnalytics.recentSessions')}
        className="smtcmp-recent-sessions"
      >
        <div className="smtcmp-sessions-list">
          {isLoading ? (
            <div className="smtcmp-loading">Loading...</div>
          ) : records.length === 0 ? (
            <div className="smtcmp-empty">
              {t('settings.agentAnalytics.noRecords')}
            </div>
          ) : (
            records.map((record) => (
              <div key={record.id} className="smtcmp-session-item">
                <div
                  className="smtcmp-session-header"
                  onClick={() =>
                    setExpandedRecordId(
                      expandedRecordId === record.id ? null : record.id,
                    )
                  }
                >
                  <ChevronDown
                    size={16}
                    className={expandedRecordId === record.id ? 'expanded' : ''}
                  />
                  <span className="smtcmp-session-info">
                    <span className="smtcmp-agent-id">{record.agentId}</span>
                    <span className="smtcmp-surface-badge">
                      {record.surface}
                    </span>
                    <span className="smtcmp-time">
                      {new Date(record.startTime).toLocaleString()}
                    </span>
                    <span
                      className={`smtcmp-status smtcmp-status-${record.success}`}
                    >
                      {record.success}
                    </span>
                  </span>
                </div>
                {expandedRecordId === record.id && (
                  <div className="smtcmp-session-details">
                    <div className="smtcmp-detail-row">
                      <span className="smtcmp-detail-label">Duration:</span>
                      <span className="smtcmp-detail-value">
                        {record.endTime - record.startTime}ms
                      </span>
                    </div>
                    {record.inputTokens && (
                      <div className="smtcmp-detail-row">
                        <span className="smtcmp-detail-label">
                          Input Tokens:
                        </span>
                        <span className="smtcmp-detail-value">
                          {record.inputTokens}
                        </span>
                      </div>
                    )}
                    {record.outputTokens && (
                      <div className="smtcmp-detail-row">
                        <span className="smtcmp-detail-label">
                          Output Tokens:
                        </span>
                        <span className="smtcmp-detail-value">
                          {record.outputTokens}
                        </span>
                      </div>
                    )}
                    {record.totalTokens && (
                      <div className="smtcmp-detail-row">
                        <span className="smtcmp-detail-label">
                          Total Tokens:
                        </span>
                        <span className="smtcmp-detail-value">
                          {record.totalTokens}
                        </span>
                      </div>
                    )}
                    {record.toolCalls && record.toolCalls.length > 0 && (
                      <div className="smtcmp-detail-row">
                        <span className="smtcmp-detail-label">Tool Calls:</span>
                        <span className="smtcmp-detail-value">
                          {record.toolCalls.map((tc, i) => (
                            <div key={i} style={{ marginTop: '4px' }}>
                              {tc.name} ({tc.status})
                            </div>
                          ))}
                        </span>
                      </div>
                    )}
                    {record.errorMessage && (
                      <div className="smtcmp-detail-row">
                        <span className="smtcmp-detail-label">Error:</span>
                        <span className="smtcmp-detail-value">
                          {record.errorMessage}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </ObsidianSetting>

      <ObsidianSetting
        name={t('settings.agentAnalytics.actions')}
        className="smtcmp-actions"
      >
        <div className="smtcmp-actions-group">
          <ObsidianButton
            text={t('settings.agentAnalytics.exportCSV')}
            onClick={handleExportCSV}
            icon="download"
          />
          <ObsidianButton
            text={t('settings.agentAnalytics.exportJSON')}
            onClick={handleExportJSON}
            icon="download"
          />
          <ObsidianButton
            text={t('settings.agentAnalytics.refresh')}
            onClick={loadData}
            icon="refresh-cw"
          />
          <ObsidianButton
            text={t('settings.agentAnalytics.clear')}
            onClick={handleClearHistory}
            icon="trash-2"
            warning={true}
          />
        </div>
      </ObsidianSetting>
    </>
  )
}
