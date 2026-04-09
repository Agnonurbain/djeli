// src/app/(student)/grin/[sessionId]/page.tsx
// Mode Grin : session d'apprentissage collaborative entre élèves (inspiré des « grins » ivoiriens)

interface GrinPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function GrinPage({ params }: GrinPageProps) {
  const { sessionId } = await params;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-3xl font-bold">Mode Grin</h1>
      <p className="mt-4 text-gray-600">
        Session collaborative en cours.
      </p>
      <p className="mt-2 text-sm text-gray-400">
        ID de session : {sessionId}
      </p>
    </main>
  );
}
