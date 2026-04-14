import Link from "next/link";
import { ShieldX } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8F9FA] px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 mb-6">
        <ShieldX className="h-10 w-10 text-red-500" />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight text-[#001D70]">Kein Zugriff</h1>
      <p className="mt-3 max-w-sm text-slate-500">
        Du hast keine Berechtigung, diese Seite aufzurufen. Diese Funktion ist nur für Administratoren verfügbar.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-[#0055FF] px-6 text-sm font-medium text-white transition-colors hover:bg-[#0044CC]"
      >
        Zur Startseite
      </Link>
    </div>
  );
}
