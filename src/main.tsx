import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { AppProviders } from './app/AppProviders'
import '@fontsource-variable/inter'
import '@fontsource-variable/noto-sans-arabic'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)
