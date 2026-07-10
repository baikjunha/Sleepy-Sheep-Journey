import { useEffect, useRef } from "react";
import { Switch, Route, useLocation, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { dark } from "@clerk/themes";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SettingsProvider, useSettings } from "@/lib/settings";
import { basePath, stripBase } from "@/lib/base-path";
import Home from "@/pages/home";
import History from "@/pages/history";
import SessionScreen from "@/pages/session";
import SleepScreen from "@/pages/sleep";
import SheepResultScreen from "@/pages/sheep-result";
import ConversationScreen from "@/pages/conversation";
import RestScreen from "@/pages/rest";
import SettingsScreen from "@/pages/settings";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// REQUIRED — copy verbatim. Resolves the key from window.location.hostname so the
// same build serves multiple Clerk custom domains.
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

// REQUIRED — empty in dev (Clerk hits dev FAPI directly), auto-set in prod.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

// Add Noto Serif fonts (Korean + Simplified Chinese coverage) — guarded for HMR
const FONT_LINK_ID = "app-noto-fonts";
if (!document.getElementById(FONT_LINK_ID)) {
  const fontLink = document.createElement("link");
  fontLink.id = FONT_LINK_ID;
  fontLink.href =
    "https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;700&family=Noto+Sans+KR:wght@300;400;500&family=Noto+Serif+SC:wght@300;400;500;700&family=Noto+Sans+SC:wght@300;400;500&display=swap";
  fontLink.rel = "stylesheet";
  document.head.appendChild(fontLink);
}

// Helps the webview stay up-to-date when the signed-in user changes.
function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/history" component={History} />
      <Route path="/session" component={SessionScreen} />
      <Route path="/sleep" component={SleepScreen} />
      <Route path="/settings" component={SettingsScreen} />
      {/* REQUIRED — the /*? optional wildcard matches both the bare URL and
          Clerk's OAuth sub-paths (/sign-in/sso-callback etc). */}
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />
      <Route path="/sheep/:id/conversation" component={ConversationScreen} />
      <Route path="/rest/:id" component={RestScreen} />
      <Route path="/sheep/:id" component={SheepResultScreen} />
      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const { t, isNight } = useSettings();

  const palette = isNight
    ? {
        primary: "#8275e8",
        foreground: "#f5f2ff",
        muted: "#aaa3d2",
        background: "#1d1839",
        input: "#161230",
        inputForeground: "#f5f2ff",
        neutral: "#aaa3d2",
        cardBox: "bg-[#1d1839] rounded-2xl w-[420px] max-w-full overflow-hidden border border-white/10 shadow-[0_18px_50px_rgba(0,0,0,0.45)]",
      }
    : {
        primary: "#cf9445",
        foreground: "#4a3f31",
        muted: "#8a795f",
        background: "#f7eedd",
        input: "#fdf8ee",
        inputForeground: "#4a3f31",
        neutral: "#8a795f",
        cardBox: "bg-[#f7eedd] rounded-2xl w-[420px] max-w-full overflow-hidden border border-black/10 shadow-[0_18px_50px_rgba(120,90,40,0.18)]",
      };

  const clerkAppearance = {
    ...(isNight ? { theme: dark } : {}),
    cssLayerName: "clerk",
    options: {
      logoPlacement: "inside" as const,
      logoLinkUrl: basePath || "/",
      logoImageUrl: `${window.location.origin}${basePath}/logo.png`,
      socialButtonsPlacement: "top" as const,
      socialButtonsVariant: "blockButton" as const,
    },
    variables: {
      colorPrimary: palette.primary,
      colorForeground: palette.foreground,
      colorMutedForeground: palette.muted,
      colorDanger: "#e5484d",
      colorBackground: palette.background,
      colorInput: palette.input,
      colorInputForeground: palette.inputForeground,
      colorNeutral: palette.neutral,
      fontFamily: '"Noto Sans KR", "Noto Sans SC", sans-serif',
      borderRadius: "1rem",
    },
    elements: {
      rootBox: "w-full flex justify-center",
      cardBox: palette.cardBox,
      card: "!shadow-none !border-0 !bg-transparent !rounded-none",
      footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
      headerTitle: isNight ? "text-[#f5f2ff] font-light" : "text-[#4a3f31] font-light",
      headerSubtitle: isNight ? "text-[#aaa3d2]" : "text-[#8a795f]",
      socialButtonsBlockButtonText: isNight ? "text-[#f5f2ff]" : "text-[#4a3f31]",
      formFieldLabel: isNight ? "text-[#c9c2ea]" : "text-[#6e5e48]",
      footerActionLink: isNight ? "text-[#a99cf5]" : "text-[#b07c33]",
      footerActionText: isNight ? "text-[#8d84c2]" : "text-[#8a795f]",
      dividerText: isNight ? "text-[#8d84c2]" : "text-[#8a795f]",
      identityPreviewEditButton: isNight ? "text-[#a99cf5]" : "text-[#b07c33]",
      formFieldSuccessText: isNight ? "text-[#9ed6a8]" : "text-[#4d7a56]",
      alertText: isNight ? "text-[#f5f2ff]" : "text-[#4a3f31]",
      logoBox: "justify-center",
      logoImage: "h-12 w-12 object-contain",
      socialButtonsBlockButton: isNight
        ? "border border-white/10 bg-white/[0.04] hover:bg-white/[0.08]"
        : "border border-black/10 bg-black/[0.03] hover:bg-black/[0.06]",
      formButtonPrimary: isNight
        ? "bg-gradient-to-br from-[#8275e8] to-[#5b4fc6] text-white hover:opacity-90"
        : "bg-gradient-to-br from-[#e3b063] to-[#cf9445] text-[#3a2a12] hover:opacity-90",
      formFieldInput: isNight ? "border border-white/10" : "border border-black/10",
      footerAction: "justify-center",
      dividerLine: isNight ? "bg-white/10" : "bg-black/10",
      alert: isNight ? "border border-white/10" : "border border-black/10",
      otpCodeFieldInput: isNight ? "border border-white/15" : "border border-black/15",
      formFieldRow: "gap-2",
      main: "gap-5",
    },
  };

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: t.auth.signInTitle,
            subtitle: t.auth.signInSubtitle,
          },
        },
        signUp: {
          start: {
            title: t.auth.signUpTitle,
            subtitle: t.auth.signUpSubtitle,
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <SettingsProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </SettingsProvider>
  );
}

export default App;
