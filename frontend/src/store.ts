import { configureStore } from '@reduxjs/toolkit'
import userReducer from './features/users/user.slice'
import { useDispatch } from 'react-redux'

export const store = configureStore({
    reducer: {
        users: userReducer,
    }
})

// types
export type AppDispatch = typeof store.dispatch
export const useAppDispatch = () => useDispatch<AppDispatch>()