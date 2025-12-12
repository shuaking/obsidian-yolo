import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useSettings } from '../../../contexts/settings-context'
import { getModelDisplayName } from '../../../utils/model-id-utils'

type ModelPickerProps = {
  selectedModelId?: string
  onModelSelected: (modelId: string) => void
  disabled?: boolean
  placeholder?: string
}

export function ModelPicker({
  selectedModelId,
  onModelSelected,
  disabled = false,
  placeholder = 'Select a model...',
}: ModelPickerProps) {
  const { settings } = useSettings()

  const enabledModels = settings.chatModels.filter(
    ({ enable }) => enable ?? true,
  )
  const providerOrder = settings.providers.map((p) => p.id)
  const providerIdsInModels = Array.from(
    new Set(enabledModels.map((m) => m.providerId)),
  )
  const orderedProviderIds = [
    ...providerOrder.filter((id) => providerIdsInModels.includes(id)),
    ...providerIdsInModels.filter((id) => !providerOrder.includes(id)),
  ]

  // Get provider name for current model
  const getCurrentModelDisplay = () => {
    if (!selectedModelId) return placeholder

    const currentModel = settings.chatModels.find(
      (m) => m.id === selectedModelId,
    )
    if (currentModel) {
      const provider = settings.providers.find(
        (p) => p.id === currentModel.providerId,
      )
      const display =
        currentModel.name || currentModel.model || currentModel.id
      const suffix = provider?.id ? ` (${provider.id})` : ''
      return `${display}${suffix}`
    }
    return placeholder
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        className="smtcmp-settings-model-picker"
        disabled={disabled}
      >
        <div className="smtcmp-settings-model-picker__model-name">
          {getCurrentModelDisplay()}
        </div>
        <div className="smtcmp-settings-model-picker__icon">
          <ChevronDown size={16} />
        </div>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="smtcmp-popover"
          collisionPadding={8}
        >
          <DropdownMenu.RadioGroup
            className="smtcmp-model-select-list"
            value={selectedModelId}
            onValueChange={onModelSelected}
          >
            {(() => {
              return orderedProviderIds.flatMap((pid) => {
                const groupModels = enabledModels.filter(
                  (m) => m.providerId === pid,
                )
                if (groupModels.length === 0) return []

                const groupHeader = (
                  <DropdownMenu.Label
                    key={`label-${pid}`}
                    className="smtcmp-popover-group-label"
                  >
                    {pid}
                  </DropdownMenu.Label>
                )

                const items = groupModels.map((chatModelOption) => {
                  const displayName =
                    chatModelOption.name ||
                    chatModelOption.model ||
                    getModelDisplayName(chatModelOption.id)

                  return (
                    <DropdownMenu.RadioItem
                      key={chatModelOption.id}
                      className="smtcmp-popover-item"
                      value={chatModelOption.id}
                    >
                      {displayName}
                    </DropdownMenu.RadioItem>
                  )
                })

                return [
                  groupHeader,
                  ...items,
                  <DropdownMenu.Separator
                    key={`sep-${pid}`}
                    className="smtcmp-popover-group-separator"
                  />,
                ]
              })
            })()}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}