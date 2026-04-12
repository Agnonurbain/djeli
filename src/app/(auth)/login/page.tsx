// src/app/(auth)/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erreur lors de l'envoi du code.");
        return;
      }

      setStep("otp");
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Code invalide.");
        return;
      }

      // Nouvel utilisateur → onboarding, sinon → tableau
      if (data.user?.isNewUser) {
        router.push("/onboarding");
      } else {
        router.push("/tableau");
      }
    } catch {
      setError("Impossible de contacter le serveur. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* En-tête */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-amber-400">Djeli</h1>
          <p className="mt-1 text-sm text-gray-400">Prof Chibi — Ton tuteur IA</p>
        </div>

        {step === "phone" ? (
          /* Étape 1 : saisie du numéro de téléphone */
          <form onSubmit={handleSendOtp} className="space-y-5">
            <Input
              label="Numéro de téléphone"
              type="tel"
              placeholder="07 01 02 03 04"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              required
              error={error || undefined}
            />

            <Button type="submit" className="w-full" disabled={loading || !phone.trim()}>
              {loading ? "Envoi en cours..." : "Recevoir le code SMS"}
            </Button>
          </form>
        ) : (
          /* Étape 2 : saisie du code OTP */
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <p className="text-center text-sm text-gray-400">
              Un code à 6 chiffres a été envoyé au{" "}
              <span className="font-medium text-gray-200">{phone}</span>
            </p>

            <Input
              label="Code de vérification"
              type="text"
              inputMode="numeric"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              autoComplete="one-time-code"
              required
              error={error || undefined}
            />

            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading ? "Vérification..." : "Valider le code"}
            </Button>

            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setOtp("");
                setError("");
              }}
              className="block w-full text-center text-sm text-amber-400 hover:underline"
            >
              Changer de numéro
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
