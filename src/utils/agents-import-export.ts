import { App, Notice } from 'obsidian'
import { z } from 'zod'
import { assistantSchema } from '../types/assistant.types'
import { useSettings } from '../contexts/settings-context'
import { useLanguage } from '../contexts/language-context'

// Schema for importing/exporting agents
const agentImportExportSchema = z.object({
  agents: z.array(assistantSchema),
  exportDate: z.number(),
  version: z.string(),
})

export type AgentImportExportData = z.infer<typeof agentImportExportSchema>

export async function exportAgents(
  app: App,
  agents: any[],
  t: (key: string, fallback?: string) => string,
) {
  try {
    const exportData: AgentImportExportData = {
      agents,
      exportDate: Date.now(),
      version: '1.0.0',
    }

    const jsonString = JSON.stringify(exportData, null, 2)

    // Try to use the Obsidian file picker to save the file
    try {
      const fileName = `smart-composer-agents-${new Date().toISOString().split('T')[0]}.json`
      
      // Try to get the vault's base path
      const vaultName = app.vault.getName()
      const filePath = `${vaultName}/${fileName}`

      const file = await app.vault.create(filePath, jsonString)
      new Notice(
        t(
          'settings.agents.exportSuccessFile',
          `Agents exported to ${file.path}`,
        ),
      )
    } catch (fileError) {
      // Fallback: try to copy to clipboard
      try {
        await navigator.clipboard.writeText(jsonString)
        new Notice(
          t(
            'settings.agents.exportSuccessClipboard',
            'Agents JSON copied to clipboard',
          ),
        )
      } catch (clipboardError) {
        // Final fallback: download as file
        const blob = new Blob([jsonString], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `smart-composer-agents-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        new Notice(
          t(
            'settings.agents.exportSuccessDownload',
            'Agents exported as download',
          ),
        )
      }
    }
  } catch (error) {
    console.error('Failed to export agents:', error)
    new Notice(
      t(
        'settings.agents.exportError',
        'Failed to export agents. Please try again.',
      ),
    )
  }
}

export async function importAgents(
  app: App,
  currentAgents: any[],
  onImport: (newAgents: any[]) => void,
  t: (key: string, fallback?: string) => string,
) {
  try {
    // Try to open a file picker to select the JSON file
    let fileContent: string | null = null

    try {
      // This is a fallback approach since Obsidian doesn't have a built-in file picker
      // In a real implementation, you might use a modal or input element
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json,application/json'
      
      const fileSelected = await new Promise<File | null>((resolve) => {
        input.onchange = (e) => {
          const files = (e.target as HTMLInputElement).files
          resolve(files?.[0] ?? null)
        }
        input.click()
      })

      if (fileSelected) {
        fileContent = await fileSelected.text()
      }
    } catch (fileError) {
      // Fallback: try clipboard
      try {
        fileContent = await navigator.clipboard.readText()
      } catch (clipboardError) {
        new Notice(
          t(
            'settings.agents.importErrorNoFile',
            'Unable to read file. Please copy the JSON content and paste it.',
          ),
        )
        return
      }
    }

    if (!fileContent) {
      new Notice(
        t('settings.agents.importErrorNoContent', 'No file content found'),
      )
      return
    }

    // Parse and validate the JSON
    let parsedData: AgentImportExportData
    try {
      parsedData = agentImportExportSchema.parse(JSON.parse(fileContent))
    } catch (parseError) {
      console.error('Invalid JSON format:', parseError)
      new Notice(
        t(
          'settings.agents.importErrorInvalidFormat',
          'Invalid JSON format. Please check your file.',
        ),
      )
      return
    }

    // Validate each agent individually
    const validAgents = []
    const errors = []

    for (const [index, agent] of parsedData.agents.entries()) {
      try {
        const validatedAgent = assistantSchema.parse(agent)
        validAgents.push(validatedAgent)
      } catch (validationError) {
        errors.push(`Agent ${index + 1}: ${validationError}`)
      }
    }

    if (errors.length > 0) {
      console.warn('Some agents failed validation:', errors)
      new Notice(
        t(
          'settings.agents.importWarningPartial',
          `Imported ${validAgents.length} agents (${errors.length} failed validation)`,
        ),
      )
    }

    if (validAgents.length === 0) {
      new Notice(
        t('settings.agents.importErrorNoValidAgents', 'No valid agents to import'),
      )
      return
    }

    // Handle merging - update existing agents and add new ones
    const updatedAgents = [...currentAgents]
    const agentIdMap = new Map(currentAgents.map(agent => [agent.id, agent]))

    for (const importedAgent of validAgents) {
      const existingAgent = agentIdMap.get(importedAgent.id)
      if (existingAgent) {
        // Update existing agent - merge IDs and update timestamps
        const updatedAgent = {
          ...importedAgent,
          id: existingAgent.id, // Keep existing ID
          updatedAt: Date.now(),
          createdAt: existingAgent.createdAt || importedAgent.createdAt,
        }
        const index = updatedAgents.findIndex(a => a.id === existingAgent.id)
        updatedAgents[index] = updatedAgent
      } else {
        // Add new agent
        const newAgent = {
          ...importedAgent,
          id: importedAgent.id || crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }
        updatedAgents.push(newAgent)
      }
    }

    onImport(updatedAgents)
    new Notice(
      t(
        'settings.agents.importSuccess',
        `Successfully imported ${validAgents.length} agents`,
      ),
    )

  } catch (error) {
    console.error('Failed to import agents:', error)
    new Notice(
      t(
        'settings.agents.importError',
        'Failed to import agents. Please try again.',
      ),
    )
  }
}