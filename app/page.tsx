"use client"

import { BrowserRouter } from "react-router-dom"
import { AuthProvider } from "../frontend/src/contexts/AuthContext"
import App from "../frontend/src/App"

export default function HomePage() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  )
}
