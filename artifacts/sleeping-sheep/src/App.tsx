import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider } from "@/lib/settings";
import Home from "@/pages/home";
import History from "@/pages/history";
import SessionScreen from "@/pages/session";
import SleepScreen from "@/pages/sleep";
import SheepResultScreen from "@/pages/sheep-result";
import ConversationScreen from "@/pages/conversation";
import RestScreen from "@/pages/rest";
import SettingsScreen from "@/pages/settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// Add Noto Serif fonts (Korean + Simplified Chinese coverage)
const fontLink = document.createElement("link");
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;700&family=Noto+Sans+KR:wght@300;400;500&family=Noto+Serif+SC:wght@300;400;500;700&family=Noto+Sans+SC:wght@300;400;500&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/history" component={History} />
      <Route path="/session" component={SessionScreen} />
      <Route path="/sleep" component={SleepScreen} />
      <Route path="/settings" component={SettingsScreen} />
      <Route path="/sheep/:id/conversation" component={ConversationScreen} />
      <Route path="/rest/:id" component={RestScreen} />
      <Route path="/sheep/:id" component={SheepResultScreen} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SettingsProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </SettingsProvider>
    </QueryClientProvider>
  );
}

export default App;
