import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { SidebarProvider } from "@/components/sidebar-provider"
import Layout from "./app/layout"
import MainMenu from "./pages/general/main-menu"
import NotFound from "./pages/general/not-found"
import Settings from "./pages/general/settings"
import Forms from "./pages/forms/forms"
import FormDetails from "./pages/forms/form-details"
import FormSubmissions from "./pages/forms/form-submissions"
import FormSubmit from "./pages/forms/form-submit"
import FormSubmission from "./pages/forms/form-submission-details"

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ui-theme">
      <SidebarProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<MainMenu />} />

              <Route path="forms" element={<Forms />} />
              <Route path="forms/:id" element={<FormDetails />} />
              <Route path="forms/:id/submissions" element={<FormSubmissions />} />
              <Route path="forms/:id/submissions/:submissionId" element={<FormSubmission />} />
              <Route path="forms/:id/submit" element={<FormSubmit />} />

              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SidebarProvider>
    </ThemeProvider>
  )
}

export default App
