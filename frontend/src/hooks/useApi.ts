import { useState } from 'react'
import { api } from '../utils/api'

export const useApi = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  return { api, loading, error, setLoading, setError }
}