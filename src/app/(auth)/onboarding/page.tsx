// src/app/(auth)/onboarding/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database";

type StudentLevel = Database["public"]["Enums"]["student_level"];

/** Niveaux scolaires groupés par cycle */
const LEVEL_GROUPS = [
  {
    label: "Collège",
    levels: [
      { value: "6eme", label: "6ème" },
      { value: "5eme", label: "5ème" },
      { value: "4eme", label: "4ème" },
      { value: "3eme", label: "3ème" },
    ],
  },
  {
    label: "Lycée",
    levels: [
      { value: "2nde", label: "2nde" },
      { value: "1ere", label: "1ère" },
      { value: "tle", label: "Terminale" },
    ],
  },
  {
    label: "Université",
    levels: [
      { value: "l1", label: "Licence 1" },
      { value: "l2", label: "Licence 2" },
      { value: "l3", label: "Licence 3" },
      { value: "m1", label: "Master 1" },
      { value: "m2", label: "Master 2" },
    ],
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [level, setLevel] = useState<StudentLevel | "">("");
  const [school, setSchool] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      // Récupérer l'utilisateur connecté
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Créer le profil dans la table users
      const { error: userError } = await supabase.from("users").upsert({
        id: user.id,
        phone: user.phone ?? "",
        role: "student" as const,
      });

      if (userError) {
        setError("Erreur lors de la création du compte.");
        return;
      }

      // Créer le profil étudiant
      const { error: profileError } = await supabase
        .from("student_profiles")
        .upsert({
          user_id: user.id,
          display_name: displayName,
          level: level as StudentLevel,
          school: school || null,
          city: city || null,
        });

      if (profileError) {
        setError("Erreur lors de la sauvegarde du profil.");
        return;
      }

      // Marquer l'utilisateur comme ayant terminé l'onboarding
      await supabase.auth.updateUser({
        data: { onboarded: true },
      });

      router.push("/tableau");
    } catch {
      setError("Erreur inattendue. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-amber-400">Bienvenue sur Djeli !</h1>
          <p className="mt-2 text-sm text-gray-400">
            Dis-nous en plus sur toi pour personnaliser ton expérience.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Comment tu t'appelles ?"
            placeholder="Ex: Aya, Kouadio, Mariam..."
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />

          {/* Sélection du niveau */}
          <fieldset>
            <legend className="mb-3 text-sm font-medium text-gray-300">
              Quel est ton niveau ?
            </legend>
            <div className="space-y-4">
              {LEVEL_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {group.levels.map((l) => (
                      <button
                        key={l.value}
                        type="button"
                        onClick={() => setLevel(l.value)}
                        className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                          level === l.value
                            ? "border-amber-500 bg-amber-500/20 text-amber-400"
                            : "border-gray-600 text-gray-400 hover:border-gray-400"
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <Input
            label="Ton école (optionnel)"
            placeholder="Ex: Lycée Classique d'Abidjan"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
          />

          <Input
            label="Ta ville (optionnel)"
            placeholder="Ex: Abidjan, Bouaké, Yamoussoukro..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !displayName.trim() || !level}
          >
            {loading ? "Enregistrement..." : "C'est parti !"}
          </Button>
        </form>
      </div>
    </main>
  );
}
