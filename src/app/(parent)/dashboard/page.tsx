// src/app/(parent)/dashboard/page.tsx
"use client";

/**
 * Dashboard Parent — Étape 7 base minimale.
 *
 * Affiche les enfants liés avec, pour chacun :
 *   - Prénom + niveau + XP + streak
 *   - Bouton "Rapport hebdo" → GET /api/parent/report
 *   - Bouton "Envoyer encouragement" → formulaire simple + POST /api/parent/boost
 *   - Bouton "Envoyer sur WhatsApp" depuis le rapport affiché
 *
 * État vide : invite à lier un premier enfant via /dashboard/link.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Child {
  linkId: string;
  studentId: string;
  linkedAt: string | null;
  displayName: string | null;
  level: string | null;
  city: string | null;
  xp: number;
  streakDays: number;
}

interface Report {
  studentId: string;
  studentName: string | null;
  level: string;
  period: string;
  exercisesThisWeek: number;
  averageScore: number | null;
  bestTopic: { topic: string; masteryLevel: string } | null;
  chatSessions: number;
  xp: number;
  streakDays: number;
  summary: string;
  whatsapp: { success: boolean; simulated?: boolean; error?: string } | null;
}

export default function ParentDashboardPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // État pour rapport et boost par enfant
  const [reports, setReports] = useState<Record<string, Report>>({});
  const [reportLoading, setReportLoading] = useState<Record<string, boolean>>({});
  const [boostOpen, setBoostOpen] = useState<string | null>(null);
  const [boostDraft, setBoostDraft] = useState<string>("");
  const [boostStatus, setBoostStatus] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/parent/link", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "Erreur lors du chargement");
      }
      if (json.role !== "parent") {
        throw new Error("Ton compte n'est pas un compte parent.");
      }
      setChildren(json.children ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function fetchReport(studentId: string, sendWhatsApp = false) {
    setReportLoading((prev) => ({ ...prev, [studentId]: true }));
    try {
      const url = new URL("/api/parent/report", window.location.origin);
      url.searchParams.set("studentId", studentId);
      if (sendWhatsApp) url.searchParams.set("send", "whatsapp");
      const res = await fetch(url.toString(), { credentials: "include" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "Erreur lors du rapport");
      }
      setReports((prev) => ({ ...prev, [studentId]: json }));
    } catch (err) {
      setReports((prev) => {
        const next = { ...prev };
        delete next[studentId];
        return next;
      });
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setReportLoading((prev) => ({ ...prev, [studentId]: false }));
    }
  }

  async function sendBoost(studentId: string) {
    if (!boostDraft.trim()) return;
    setBoostStatus("Envoi en cours…");
    try {
      const res = await fetch("/api/parent/boost", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, message: boostDraft.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "Échec de l'envoi");
      }
      setBoostStatus(
        json.simulated
          ? "Envoyé (mode simulé — Twilio non configuré)"
          : "Message envoyé sur WhatsApp ✓"
      );
      setBoostDraft("");
      setTimeout(() => {
        setBoostOpen(null);
        setBoostStatus(null);
      }, 2000);
    } catch (err) {
      setBoostStatus(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-4 py-6">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Parent</h1>
          <p className="mt-1 text-sm text-gray-600">
            Suis la progression de tes enfants sur Djeli.
          </p>
        </div>
        <Link
          href="/dashboard/link"
          className="shrink-0 rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-amber-400"
        >
          + Lier un enfant
        </Link>
      </header>

      {loading && (
        <p className="text-sm text-gray-500">Chargement de tes enfants…</p>
      )}

      {error && !loading && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
          <button
            type="button"
            onClick={() => void refresh()}
            className="ml-3 underline hover:no-underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {!loading && !error && children.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <p className="text-base font-semibold text-gray-900">
            Aucun enfant lié pour l&apos;instant.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Demande à ton enfant son code d&apos;appairage (affiché dans son
            espace Djeli), puis entre-le pour accéder à sa progression.
          </p>
          <Link
            href="/dashboard/link"
            className="mt-4 inline-block rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-amber-400"
          >
            Entrer un code d&apos;appairage
          </Link>
        </div>
      )}

      {!loading && !error && children.length > 0 && (
        <ul className="space-y-4">
          {children.map((child) => {
            const report = reports[child.studentId];
            const isLoadingReport = reportLoading[child.studentId] ?? false;
            const isBoostOpen = boostOpen === child.studentId;

            return (
              <li
                key={child.studentId}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {child.displayName ?? "Élève"}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Niveau {child.level ?? "—"}
                      {child.city ? ` · ${child.city}` : ""}
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-600">
                    <p>
                      <span className="font-semibold text-gray-900">{child.xp}</span>{" "}
                      XP
                    </p>
                    <p>
                      🔥 {child.streakDays} j
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void fetchReport(child.studentId, false)}
                    disabled={isLoadingReport}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isLoadingReport ? "Chargement…" : "Voir le rapport hebdo"}
                  </button>

                  {report && (
                    <button
                      type="button"
                      onClick={() => void fetchReport(child.studentId, true)}
                      disabled={isLoadingReport}
                      className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                    >
                      📲 Envoyer sur WhatsApp
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setBoostOpen(isBoostOpen ? null : child.studentId);
                      setBoostDraft("");
                      setBoostStatus(null);
                    }}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-100"
                  >
                    💬 Encouragement
                  </button>
                </div>

                {report && (
                  <section className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Semaine {report.period}
                    </h3>
                    <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-gray-800">
                      {report.summary}
                    </pre>
                    {report.whatsapp && (
                      <p
                        className={`mt-3 text-xs ${
                          report.whatsapp.success
                            ? "text-emerald-700"
                            : "text-red-700"
                        }`}
                      >
                        {report.whatsapp.success
                          ? report.whatsapp.simulated
                            ? "Envoi WhatsApp simulé (Twilio non configuré)."
                            : "Rapport envoyé sur WhatsApp."
                          : `Échec WhatsApp : ${report.whatsapp.error}`}
                      </p>
                    )}
                  </section>
                )}

                {isBoostOpen && (
                  <section className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <label
                      htmlFor={`boost-${child.studentId}`}
                      className="block text-sm font-medium text-gray-800"
                    >
                      Message (max 280 caractères)
                    </label>
                    <textarea
                      id={`boost-${child.studentId}`}
                      rows={3}
                      value={boostDraft}
                      onChange={(e) => setBoostDraft(e.target.value.slice(0, 280))}
                      placeholder="Ex : Bravo pour ta semaine, continue comme ça !"
                      className="mt-2 w-full rounded-md border border-amber-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
                    />
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>{boostDraft.length}/280</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setBoostOpen(null);
                            setBoostStatus(null);
                          }}
                          className="rounded-md px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          disabled={!boostDraft.trim()}
                          onClick={() => void sendBoost(child.studentId)}
                          className="rounded-md bg-amber-500 px-3 py-1.5 text-sm font-semibold text-gray-900 hover:bg-amber-400 disabled:opacity-50"
                        >
                          Envoyer sur WhatsApp
                        </button>
                      </div>
                    </div>
                    {boostStatus && (
                      <p className="mt-2 text-xs text-gray-700">{boostStatus}</p>
                    )}
                  </section>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
