import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.jsx'
import JoorchinBuiltBy from './components/JoorchinBuiltBy.jsx'
import RouteErrorBoundary from './components/RouteErrorBoundary.jsx'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {/* Platform chrome: fails alone, never takes the app down with it. */}
      <RouteErrorBoundary routeName="JoorchinBuiltBy" fallback={() => null}>
        <JoorchinBuiltBy />
      </RouteErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
