import { useEffect, useRef, useState } from "react";

let googleScriptPromise;

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  return googleScriptPromise;
}

export default function GoogleAuthButton({ role = "jobseeker", onSuccess, disabled = false }) {
  const buttonRef = useRef(null);
  const [error, setError] = useState("");
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || disabled) return;

    let mounted = true;

    loadGoogleScript()
      .then(() => {
        if (!mounted || !buttonRef.current) return;

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => onSuccess(response.credential, role)
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: buttonRef.current.offsetWidth || 320,
          text: "continue_with"
        });
      })
      .catch(() => {
        if (mounted) setError("Google sign-in could not load.");
      });

    return () => {
      mounted = false;
    };
  }, [clientId, disabled, onSuccess, role]);

  if (!clientId) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-3 text-center text-sm text-neutral-500 dark:border-neutral-700">
        Add VITE_GOOGLE_CLIENT_ID to enable Google sign-in.
      </div>
    );
  }

  if (disabled) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 p-3 text-center text-sm text-neutral-500 dark:border-neutral-700">
        Google sign-in is available for job seekers and employers.
      </div>
    );
  }

  return (
    <div>
      <div ref={buttonRef} className="flex min-h-11 justify-center" />
      {error && <p className="mt-2 text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}
