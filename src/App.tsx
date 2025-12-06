import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Trades from "./pages/Trades";
import Analytics from "./pages/Analytics";
import Psychology from "./pages/Psychology";
import Capital from "./pages/Capital";
import Settings from "./pages/Settings";
import Live from "./pages/Live";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/trades" element={<Trades />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/psychology" element={<Psychology />} />
            <Route path="/capital" element={<Capital />} />
            <Route path="/live" element={<Live />} />
            <Route path="/alerts" element={<ComingSoon title="Alerts" description="Price, IV, OI, and risk rule alerts with real-time notifications coming soon." />} />
            <Route path="/goals" element={<ComingSoon title="Goals & Habits" description="Set weekly goals, track habit streaks, and get coaching reminders." />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
