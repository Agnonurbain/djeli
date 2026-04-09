// src/app/(student)/layout.tsx
// Layout élève : barre de navigation inférieure + avatar persistant (Prof Chibi)
export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* TODO: Barre de navigation + avatar persistant Prof Chibi */}
      <div className="flex-1">{children}</div>
    </div>
  );
}
