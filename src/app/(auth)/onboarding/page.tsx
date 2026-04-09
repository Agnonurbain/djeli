// src/app/(auth)/onboarding/page.tsx
// Parcours d'intégration : l'élève choisit son niveau (6ème → université) et ses matières
export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">Choix du niveau</h1>
      <p className="mt-4 text-gray-600">
        Sélectionnez votre classe et vos matières pour personnaliser votre
        expérience.
      </p>
    </main>
  );
}
