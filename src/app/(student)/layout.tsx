// src/app/(student)/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/tableau", label: "Tableau", icon: "📝" },
  { href: "/arbre", label: "Arbre", icon: "🌳" },
  { href: "/abonnement", label: "Premium", icon: "⭐" },
  { href: "/tableau/inviter", label: "Parents", icon: "👪" },
] as const;

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1 pb-16">{children}</div>

      {/* Barre de navigation inférieure — standard mobile */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-200 bg-white/95 backdrop-blur"
        aria-label="Navigation élève"
      >
        <div className="mx-auto flex max-w-lg">
          {NAV_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                  active
                    ? "text-amber-600"
                    : "text-gray-500 hover:text-gray-900"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className="text-lg" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
