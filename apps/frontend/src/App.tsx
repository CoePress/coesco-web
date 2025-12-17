import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { SidebarProvider } from '@/components/sidebar-provider'
import Layout from './app/layout'
import MainMenu from './pages/main-menu'
import ExamplePage from './pages/example-page'
import NotFound from './pages/not-found'

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <SidebarProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<MainMenu />} />
              <Route path="example" element={<ExamplePage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App
