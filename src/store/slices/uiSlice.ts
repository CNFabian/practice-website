import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  showOnboardingModal: boolean
}

const initialState: UIState = {
  showOnboardingModal: false
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openOnboardingModal: (state) => {
      state.showOnboardingModal = true
    },
    closeOnboardingModal: (state) => {
      state.showOnboardingModal = false
    },
    toggleOnboardingModal: (state) => {
      state.showOnboardingModal = !state.showOnboardingModal
    }
  }
})

export const { 
  openOnboardingModal, 
  closeOnboardingModal, 
  toggleOnboardingModal 
} = uiSlice.actions

export default uiSlice.reducer