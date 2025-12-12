import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react'

import { DatabaseManager } from '../database/DatabaseManager'
import { AgentHistoryManager } from '../database/modules/AgentHistoryManager'
import { VectorManager } from '../database/modules/vector/VectorManager'

type DatabaseContextType = {
  getDatabaseManager: () => Promise<DatabaseManager>
  getVectorManager: () => Promise<VectorManager>
  getAgentHistoryManager: () => Promise<AgentHistoryManager>
}

const DatabaseContext = createContext<DatabaseContextType | null>(null)

export function DatabaseProvider({
  children,
  getDatabaseManager,
}: {
  children: React.ReactNode
  getDatabaseManager: () => Promise<DatabaseManager>
}) {
  const getVectorManager = useCallback(async () => {
    return (await getDatabaseManager()).getVectorManager()
  }, [getDatabaseManager])

  const getAgentHistoryManager = useCallback(async () => {
    return (await getDatabaseManager()).getAgentHistoryManager()
  }, [getDatabaseManager])

  useEffect(() => {
    // start initialization of dbManager in the background
    void getDatabaseManager()
  }, [getDatabaseManager])

  const value = useMemo(() => {
    return { getDatabaseManager, getVectorManager, getAgentHistoryManager }
  }, [getDatabaseManager, getVectorManager, getAgentHistoryManager])

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  )
}

export function useDatabase(): DatabaseContextType {
  const context = useContext(DatabaseContext)
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider')
  }
  return context
}
