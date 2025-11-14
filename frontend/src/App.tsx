import { createContext } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import "@/App.css";
import { CurrentUserResponse } from "@/client";
import { useCurrentUser } from "@/hooks/api/useCurrentUser";
import MainLayout from "@/components/ui/MainLayout";
import AuthLayout from "@/components/ui/AuthLayout";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ConfirmProvider } from "material-ui-confirm";
import { SignUpDialogProvider } from "@/context/SignUpDialogContext";
import TermsOfUse from "@/pages/TermsOfUse";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import PricingPage from "@/pages/Pricing";
import ForgotPassword from "@/pages/ForgotPassword";
import CheckEmail from "@/pages/CheckEmail";
import ResetPassword from "@/pages/ResetPassword";
import PasswordResetSuccess from "@/pages/PasswordResetSuccess";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import NotFound from "@/pages/NotFound";
import ServerError from "@/pages/ServerError";
import ErrorBoundary from "@/components/ErrorBoundary";
import {
  createTheme,
  CssBaseline,
  PaletteMode,
  ThemeProvider,
} from "@mui/material";
import getMPTheme from "./theme/getTheme";
import React from "react";
import MyArticles from "./pages/Article/MyArticles";
import CreateArticle from "./pages/Article/CreateArticle";
import EditArticle from "./pages/Article/EditArticle";
import ViewArticle from "./pages/Article/ViewArticle";
import EditProfile from "./pages/Profile/EditProfile";
import Dashboard from "./pages/Dashboard";
import AppTheme from "./theme/AppTheme";
import UIGuidelines from "./pages/UIGuidelines";
import Analytics from "./pages/Analytics";
import Integrations from "./pages/Integrations";
import Billing from "./pages/Billing";
import MyClients from "./pages/Clients/MyClients";
import CreateClient from "./pages/Clients/CreateClient";
import EditClient from "./pages/Clients/EditClient";
import ClientDetail from "./pages/Clients/ClientDetail";
import ClientCrawl from "./pages/Clients/ClientCrawl";
import CreateProject from "./pages/Projects/CreateProject";
import EditProject from "./pages/Projects/EditProject";
import ProjectDetail from "./pages/Projects/ProjectDetail";
import ProjectCrawling from "./pages/Projects/ProjectCrawling";
import DeepResearchList from "./pages/DeepResearch/DeepResearchList";
import CreateResearch from "./pages/DeepResearch/CreateResearch";
import ResearchDetail from "./pages/DeepResearch/ResearchDetail";

export const UserContext = createContext<CurrentUserResponse | undefined>(
  undefined
);

function App(props: { disableCustomTheme?: boolean }) {
  const [mode] = React.useState<PaletteMode>("dark");
  const [showCustomTheme] = React.useState(true);
  const { data: currentUser } = useCurrentUser();
  const MPTheme = createTheme(getMPTheme(mode));
  const defaultTheme = createTheme({ palette: { mode } });

  return (
    <AppTheme {...props}>
      <CssBaseline enableColorScheme />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 4000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <ErrorBoundary>
        <UserContext.Provider value={currentUser}>
          <ConfirmProvider>
            <SignUpDialogProvider>
              <Routes>
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/check-email" element={<CheckEmail />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/password-reset-success" element={<PasswordResetSuccess />} />
                </Route>
                <Route element={<MainLayout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/terms" element={<TermsOfUse />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/pricing" element={<PricingPage />} />
                  
                  {/* Error pages */}
                  <Route path="/404" element={<NotFound />} />
                  <Route path="/500" element={<ServerError />} />
                  <Route path="/error" element={<ServerError errorCode={500} message="An unexpected error occurred" />} />
                  
                  <Route element={<ProtectedRoute />}>
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="dashboard/my-articles" element={<MyArticles />} />
                    <Route path="dashboard/my-articles/new" element={<CreateArticle />} />
                    <Route path="dashboard/my-articles/:id/edit" element={<EditArticle />} />
                    <Route path="dashboard/my-articles/:id/view" element={<ViewArticle />} />
                    <Route path="dashboard/profile" element={<EditProfile />} />
                    <Route path="dashboard/ui-guidelines" element={<UIGuidelines />} />
                    <Route path="dashboard/analytics" element={<Analytics />} />
                    <Route path="dashboard/integrations" element={<Integrations />} />
                    <Route path="dashboard/billing" element={<Billing />} />
                    <Route path="dashboard/payment/success" element={<PaymentSuccess />} />
                    <Route path="dashboard/payment/cancel" element={<PaymentCancel />} />

                    {/* Client routes */}
                    <Route path="clients" element={<MyClients />} />
                    <Route path="clients/new" element={<CreateClient />} />
                    <Route path="clients/:clientId" element={<ClientDetail />} />
                    <Route path="clients/:clientId/edit" element={<EditClient />} />
                    <Route path="clients/:clientId/crawl" element={<ClientCrawl />} />

                    {/* Project routes */}
                    <Route path="clients/:clientId/projects/new" element={<CreateProject />} />
                    <Route path="projects/:projectId" element={<ProjectDetail />} />
                    <Route path="projects/:projectId/edit" element={<EditProject />} />
                    <Route path="projects/:projectId/crawling" element={<ProjectCrawling />} />

                    {/* Deep Researcher routes */}
                    <Route path="dashboard/deep-researcher" element={<DeepResearchList />} />
                    <Route path="dashboard/deep-researcher/new" element={<CreateResearch />} />
                    <Route path="dashboard/deep-researcher/:researchId" element={<ResearchDetail />} />
                  </Route>
                  
                  {/* Catch-all route for 404 - must be last */}
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </SignUpDialogProvider>
          </ConfirmProvider>
        </UserContext.Provider>
      </ErrorBoundary>
    </AppTheme>
  );
}

export default App;
