// src/app/page.tsx

/**
 * Page d'accueil — redirige selon l'état d'authentification :
 * - Non connecté → /login
 * - Connecté mais onboarding pas fini → /onboarding
 * - Connecté et onboarding fini → /tableau
 *
 * Server Component : la redirection est faite côté serveur pour éviter
 * le flash de contenu et garder l'accueil ultra léger.
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // L'utilisateur a-t-il déjà fait l'onboarding ?
  const onboarded = Boolean(user.user_metadata?.onboarded);
  if (!onboarded) {
    redirect("/onboarding");
  }

  redirect("/tableau");
}
