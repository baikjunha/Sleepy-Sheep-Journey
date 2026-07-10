import { SignUp } from "@clerk/react";
import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";
import { useSettings } from "@/lib/settings";
import { basePath } from "@/lib/base-path";

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const { t } = useSettings();

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-[420px] mb-4">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-1 text-[13px] text-foreground/40 hover:text-foreground/70 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {t.auth.backHome}
        </button>
      </div>
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}
