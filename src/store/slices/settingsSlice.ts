import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface SettingsState {
  useMockData: boolean
}

const initialState: SettingsState = {
  useMockData: false
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setUseMockData: (state, action: PayloadAction<boolean>) => {
      state.useMockData = action.payload
    },
    toggleMockData: (state) => {
      state.useMockData = !state.useMockData
    }
  }
})

export const { setUseMockData, toggleMockData } = settingsSlice.actions
export default settingsSlice.reducer