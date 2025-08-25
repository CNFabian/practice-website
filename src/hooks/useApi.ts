import { useState, useEffect } from 'react'
import { api } from '../utils/api'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export const useApi = <T>(url: string) => {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))
        const response = await api.get<T>(url)
        setState({
          data: response.data,
          loading: false,
          error: null
        })
      } catch (error) {
        setState({
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'An error occurred'
        })
      }
    }

    fetchData()
  }, [url])

  return state
}
