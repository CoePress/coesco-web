import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarProvider } from "@/components/sidebar-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { ProtectedRoute, PublicRoute } from "@/components/routes";
import Layout from "./app/layout";
import MainMenu from "./pages/general/main-menu";
import NotFound from "./pages/general/not-found";
import Settings from "./pages/general/settings";
import Login from "./pages/general/login";
import ForgotPassword from "./pages/general/forgot-password";
import ResetPassword from "./pages/general/reset-password";
import RequestAccess from "./pages/general/request-access";
import Register from "./pages/general/register";
import Forms from "./pages/forms/forms";
import FormDetails from "./pages/forms/form-details";
import FormBuilder from "./pages/forms/form-builder";
import FormSubmissions from "./pages/forms/form-submissions";
import FormSubmit from "./pages/forms/form-submit";
import FormSubmission from "./pages/forms/form-submission-details";
import Admin from "./pages/admin/users";

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <BrowserRouter>
        <AuthProvider>
          <SidebarProvider>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicRoute />}>
                <Route path="login" element={<Login />} />
                <Route path="forgot-password" element={<ForgotPassword />} />
                <Route path="reset-password" element={<ResetPassword />} />
                <Route path="request-access" element={<RequestAccess />} />
                <Route path="register" element={<Register />} />
              </Route>

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route index element={<MainMenu />} />

                  <Route path="forms" element={<Forms />} />
                  <Route path="forms/:id" element={<FormDetails />} />
                  <Route path="forms/:id/edit" element={<FormBuilder />} />
                  <Route path="forms/:id/submissions" element={<FormSubmissions />} />
                  <Route path="forms/:id/submissions/:submissionId" element={<FormSubmission />} />
                  <Route path="forms/:id/submit" element={<FormSubmit />} />

                  <Route path="settings" element={<Settings />} />
                  <Route path="admin" element={<Admin />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Route>
            </Routes>
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
