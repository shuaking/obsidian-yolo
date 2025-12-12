import { SelectAgentHistory } from '../../database/schema'

export function exportToCSV(records: SelectAgentHistory[]): string {
  const headers = [
    'ID',
    'Agent ID',
    'Surface',
    'Conversation ID',
    'Start Time',
    'End Time',
    'Duration (ms)',
    'Input Tokens',
    'Output Tokens',
    'Total Tokens',
    'Tool Calls',
    'Success',
    'Error Message',
  ]

  const rows = records.map((record) => [
    record.id.toString(),
    record.agentId,
    record.surface,
    record.conversationId || '',
    new Date(record.startTime).toISOString(),
    new Date(record.endTime).toISOString(),
    (record.endTime - record.startTime).toString(),
    record.inputTokens?.toString() || '',
    record.outputTokens?.toString() || '',
    record.totalTokens?.toString() || '',
    record.toolCalls ? JSON.stringify(record.toolCalls) : '',
    record.success,
    record.errorMessage || '',
  ])

  const csv = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n')

  return csv
}

export function exportToJSON(records: SelectAgentHistory[]): string {
  const jsonData = records.map((record) => ({
    id: record.id,
    agentId: record.agentId,
    surface: record.surface,
    conversationId: record.conversationId,
    startTime: new Date(record.startTime).toISOString(),
    endTime: new Date(record.endTime).toISOString(),
    duration: record.endTime - record.startTime,
    tokens: {
      input: record.inputTokens,
      output: record.outputTokens,
      total: record.totalTokens,
    },
    toolCalls: record.toolCalls,
    success: record.success,
    errorMessage: record.errorMessage,
  }))

  return JSON.stringify(jsonData, null, 2)
}

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
