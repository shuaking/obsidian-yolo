import { useEffect, useState } from 'react'
import { ObsidianButton } from '../../common/ObsidianButton'
import { useMcp } from '../../../contexts/mcp-context'
import { useLanguage } from '../../../contexts/language-context'
import { McpTool } from '../../../types/mcp.types'
import { ObsidianSetting } from '../../common/ObsidianSetting'

type ToolSelectorProps = {
  selectedTools: string[]
  onToolsChange: (tools: string[]) => void
  disabled?: boolean
}

export function ToolSelector({
  selectedTools,
  onToolsChange,
  disabled = false,
}: ToolSelectorProps) {
  const { getMcpManager } = useMcp()
  const { t } = useLanguage()
  const [availableTools, setAvailableTools] = useState<McpTool[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTools = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const mcpManager = await getMcpManager()
        const tools = await mcpManager.listAvailableTools()
        setAvailableTools(tools)
      } catch (error) {
        console.error('Failed to load available tools:', error)
        setError(error instanceof Error ? error.message : 'Failed to load tools')
      } finally {
        setIsLoading(false)
      }
    }

    void loadTools()
  }, [getMcpManager])

  const toggleTool = (toolName: string) => {
    const newTools = selectedTools.includes(toolName)
      ? selectedTools.filter((t) => t !== toolName)
      : [...selectedTools, toolName]
    onToolsChange(newTools)
  }

  const selectAllTools = () => {
    onToolsChange(availableTools.map((tool) => tool.name))
  }

  const clearAllTools = () => {
    onToolsChange([])
  }

  if (isLoading) {
    return (
      <ObsidianSetting
        name={t('settings.agents.tools', 'Tools')}
        desc={t('settings.agents.toolsDesc', 'MCP tools available to this agent')}
      >
        <div className="smtcmp-loading">{t('common.loading', 'Loading...')}</div>
      </ObsidianSetting>
    )
  }

  if (error) {
    return (
      <ObsidianSetting
        name={t('settings.agents.tools', 'Tools')}
        desc={t('settings.agents.toolsDesc', 'MCP tools available to this agent')}
      >
        <div className="smtcmp-error">{error}</div>
      </ObsidianSetting>
    )
  }

  if (availableTools.length === 0) {
    return (
      <ObsidianSetting
        name={t('settings.agents.tools', 'Tools')}
        desc={t('settings.agents.toolsDesc', 'MCP tools available to this agent')}
      >
        <div className="smtcmp-no-tools">
          {t('settings.agents.noToolsAvailable', 'No MCP tools available')}
        </div>
      </ObsidianSetting>
    )
  }

  return (
    <ObsidianSetting
      name={t('settings.agents.tools', 'Tools')}
      desc={t('settings.agents.toolsDesc', 'MCP tools available to this agent')}
    >
      <div className="smtcmp-tool-selector">
        <div className="smtcmp-tool-selector-controls">
          <ObsidianButton
            text={t('common.selectAll', 'Select all')}
            onClick={selectAllTools}
            disabled={disabled || availableTools.length === selectedTools.length}
          />
          <ObsidianButton
            text={t('common.clear', 'Clear')}
            onClick={clearAllTools}
            disabled={disabled || selectedTools.length === 0}
          />
        </div>
        <div className="smtcmp-tool-selector-list">
          {availableTools.map((tool) => (
            <label
              key={tool.name}
              className={`smtcmp-tool-selector-item ${disabled ? 'disabled' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedTools.includes(tool.name)}
                onChange={() => toggleTool(tool.name)}
                disabled={disabled}
              />
              <div className="smtcmp-tool-selector-item-content">
                <div className="smtcmp-tool-selector-item-name">
                  {tool.name}
                </div>
                {tool.description && (
                  <div className="smtcmp-tool-selector-item-desc">
                    {tool.description}
                  </div>
                )}
                {tool.inputSchema && tool.inputSchema.type && (
                  <div className="smtcmp-tool-selector-item-schema">
                    {t('settings.agents.schema', 'Schema')}: {tool.inputSchema.type}
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>
    </ObsidianSetting>
  )
}