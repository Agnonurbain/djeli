// src/app/(auth)/login/page.tsx
// Authentification par OTP SMS — pas d'email, car tous les utilisateurs n'en disposent pas
export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">Connexion</h1>
      <p className="mt-4 text-gray-600">
        Entrez votre numéro de téléphone pour recevoir un code OTP par SMS.
      </p>
    </main>
  );
}
