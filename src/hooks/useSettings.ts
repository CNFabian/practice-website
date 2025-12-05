import { useSelector, useDispatch } from 'react-redux'
import { useCallback } from 'react'
import type { RootState, AppDispatch } from '../store/store'
import { setUseMockData, toggleMockData } from '../store/slices/settingsSlice'

export const useSettings = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { useMockData } = useSelector((state: RootState) => state.settings)

  const setMockDataEnabled = useCallback((enabled: boolean) => {
    dispatch(setUseMockData(enabled))
  }, [dispatch])

  const toggleMockDataEnabled = useCallback(() => {
    dispatch(toggleMockData())
  }, [dispatch])

  return {
    useMockData,
    setMockDataEnabled,
    toggleMockDataEnabled
  }
}