// src/app/(parent)/layout.tsx
// Layout parent : tableau de bord de suivi des enfants
export default function ParentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* TODO: Navigation parent + sélecteur d'enfant */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
