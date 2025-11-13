import { useState, useCallback } from "react"
import type { ScheduledSession, CreateSessionInput, UpdateSessionInput } from "@/types/schedule"

export function useSchedule() {
  const [sessions, setSessions] = useState<ScheduledSession[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = useCallback(async (filters?: {
    status?: string
    from_date?: string
    to_date?: string
  }) => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters?.status) params.append("status", filters.status)
      if (filters?.from_date) params.append("from_date", filters.from_date)
      if (filters?.to_date) params.append("to_date", filters.to_date)

      const response = await fetch(`/api/schedule?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch sessions")
      }

      const data = await response.json()
      setSessions(data.sessions || [])
      return data.sessions
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch sessions"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const createSession = useCallback(async (input: CreateSessionInput) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create session")
      }

      const data = await response.json()
      
      setSessions((prev) => [...prev, data.session])
      
      return data.session
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create session"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateSession = useCallback(async (id: string, input: UpdateSessionInput) => {
    setIsLoading(true)
    setError(null)

    const previousSessions = [...sessions]

    try {
      setSessions((prev) =>
        prev.map((session) =>
          session.id === id ? { ...session, ...input } : session
        )
      )

      const response = await fetch(`/api/schedule/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      })

      if (!response.ok) {
        throw new Error("Failed to update session")
      }

      const data = await response.json()
      
      setSessions((prev) =>
        prev.map((session) => (session.id === id ? data.session : session))
      )
      
      return data.session
    } catch (err) {
      setSessions(previousSessions)
      const message = err instanceof Error ? err.message : "Failed to update session"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [sessions])

  const deleteSession = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)

    const previousSessions = [...sessions]

    try {
      setSessions((prev) => prev.filter((session) => session.id !== id))

      const response = await fetch(`/api/schedule/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete session")
      }

      return true
    } catch (err) {
      setSessions(previousSessions)
      const message = err instanceof Error ? err.message : "Failed to delete session"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [sessions])

  const cancelSession = useCallback(async (id: string) => {
    return updateSession(id, { status: "cancelled" })
  }, [updateSession])

  return {
    sessions,
    isLoading,
    error,
    fetchSessions,
    createSession,
    updateSession,
    deleteSession,
    cancelSession,
  }
}
