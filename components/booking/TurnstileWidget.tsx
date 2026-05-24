"use client";

import { useEffect, useRef } from "react";

// Site key público de Cloudflare Turnstile para luluandnails.com.
// Es seguro tenerlo en client-side; el Secret Key vive en Vercel env vars.
const SITE_KEY = "0x4AAAAAADVFn3jz4aP_XOYi";
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js";

type TurnstileOpts = {
  sitekey: string;
  callback?: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "flexible" | "compact" | "invisible";
  action?: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (container: string | HTMLElement, opts: TurnstileOpts) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export function TurnstileWidget({
  onToken,
  onError,
}: {
  onToken: (token: string) => void;
  onError?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  // Stable refs para evitar re-renders del widget cuando los callbacks cambian.
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);
  useEffect(() => { onTokenRef.current = onToken; }, [onToken]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    let cancelled = false;

    function renderWidget() {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      if (widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        action: "booking",
        theme: "light",
        callback: (token: string) => {
          if (!cancelled) onTokenRef.current(token);
        },
        "error-callback": () => {
          if (!cancelled) onErrorRef.current?.();
        },
        "expired-callback": () => {
          // Token expiró antes de que se mandara — limpiamos.
          if (!cancelled) onTokenRef.current("");
        },
      });
    }

    // Si el script ya está cargado, renderizar directo.
    if (window.turnstile) {
      renderWidget();
    } else {
      // Reusar el script si otro Widget ya lo agregó.
      let script = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_URL}"]`);
      if (!script) {
        script = document.createElement("script");
        script.src = SCRIPT_URL;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", renderWidget);
    }

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, []);

  return (
    <div className="mt-4 flex justify-center">
      <div ref={containerRef} />
    </div>
  );
}
