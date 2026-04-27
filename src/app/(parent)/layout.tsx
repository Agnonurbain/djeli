// src/app/(parent)/layout.tsx
import Link from "next/link";

export default function ParentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <nav className="border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link
            href="/dashboard"
            className="text-lg font-bold text-gray-900"
          >
            Djeli <span className="text-sm font-normal text-gray-500">Parent</span>
          </Link>
          <Link
            href="/dashboard/link"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
          >
            + Lier un enfant
          </Link>
        </div>
      </nav>
      <div className="flex-1">{children}</div>
    </div>
  );
}
