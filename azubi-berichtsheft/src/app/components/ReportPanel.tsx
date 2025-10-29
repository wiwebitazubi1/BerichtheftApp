"use client";

import { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { format } from 'date-fns';

interface ReportSummary {
  id: number;
  date: string;
  type: string;
  status: string;
}

interface ReportPanelProps {
  /** ISO date (yyyy-MM-dd) of the selected day. */
  isoDate: string;
  /** Callback invoked when the panel should close. */
  onClose: () => void;
}

/**
 * Panel shown when a day in the calendar is selected.  It fetches reports for
 * the selected date and displays them.  Trainees can create or edit their
 * report; instructors can review and comment on reports.  This component
 * intentionally keeps its logic simple – it does not yet implement all
 * possible workflows (for example editing comments inline) but demonstrates
 * how the state transitions work.
 */
export default function ReportPanel({ isoDate, onClose }: ReportPanelProps) {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [user, setUser] = useState<{ id: number; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch current user and reports on mount or when isoDate changes
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [userRes, reportsRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch(`/api/reports?date=${isoDate}`),
        ]);
        if (userRes.ok) {
          const u = await userRes.json();
          setUser(u);
        }
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setReports(data.reports);
        }
      } catch {
        setError('Fehler beim Laden der Daten');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isoDate]);

  // Handler for creating a new report (AZUBI only)
  async function handleCreateReport() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: isoDate, type: 'TAG', content }),
      });
      if (res.ok) {
        const data = await res.json();
        setReports([...reports, data.report]);
        setContent('');
      } else {
        const d = await res.json();
        setError(d.error || 'Fehler beim Speichern');
      }
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setSubmitting(false);
    }
  }

  // Handler for submitting a draft (AZUBI)
  async function handleSubmitReport(id: number) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reports/${id}/submit`, { method: 'POST' });
      if (res.ok) {
        // Update the status locally
        setReports(
          reports.map((r) => (r.id === id ? { ...r, status: 'EINGEREICHT' } : r)),
        );
      } else {
        const d = await res.json();
        setError(d.error || 'Fehler beim Einreichen');
      }
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setSubmitting(false);
    }
  }

  // Handler for approving a report (AUSBILDER)
  async function handleApprove(id: number) {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reports/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        setReports(
          reports.map((r) => (r.id === id ? { ...r, status: 'GEPRUEFT' } : r)),
        );
      } else {
        const d = await res.json();
        setError(d.error || 'Fehler beim Freigeben');
      }
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setSubmitting(false);
    }
  }

  // Handler for requesting changes (AUSBILDER)
  async function handleRequestChanges(id: number) {
    const comment = prompt('Kommentar für den Änderungsbedarf:');
    if (!comment) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reports/${id}/request-changes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: comment }),
      });
      if (res.ok) {
        setReports(
          reports.map((r) => (r.id === id ? { ...r, status: 'AENDERUNGSBEDARF' } : r)),
        );
      } else {
        const d = await res.json();
        setError(d.error || 'Fehler beim Zurücksenden');
      }
    } catch {
      setError('Netzwerkfehler');
    } finally {
      setSubmitting(false);
    }
  }

  const formattedDate = format(new Date(isoDate), 'dd.MM.yyyy');

  return (
    <Dialog open onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-lg rounded-md bg-card p-6 shadow-lg overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold mb-2">
            Berichte am {formattedDate}
          </Dialog.Title>
          <button onClick={onClose} className="absolute right-4 top-4 text-sm underline">
            Schließen
          </button>
          {loading && <p>Lade…</p>}
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          {!loading && reports.length === 0 && user?.role === 'AZUBI' && (
            <div>
              <p className="mb-2">Kein Bericht vorhanden. Erstelle einen neuen Bericht:</p>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full min-h-[120px] rounded border border-input bg-background p-2 mb-2"
                placeholder="Tätigkeiten, Stunden, Lerninhalte, Notizen…"
              />
              <button
                onClick={handleCreateReport}
                disabled={submitting || !content}
                className="rounded bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90 disabled:opacity-50"
              >
                Speichern
              </button>
            </div>
          )}
          {!loading && reports.map((report) => (
            <div key={report.id} className="border border-muted rounded p-3 mb-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{report.type === 'TAG' ? 'Tagesbericht' : 'Wochenbericht'}</span>
                <span className="text-xs uppercase">{report.status}</span>
              </div>
              {/* Placeholder: In a full implementation, fetch and display the report content */}
              <p className="text-sm text-muted-foreground mt-2">
                Bericht-ID: {report.id}
              </p>
              {user?.role === 'AZUBI' && report.status === 'ENTWURF' && (
                <button
                  onClick={() => handleSubmitReport(report.id)}
                  disabled={submitting}
                  className="mt-2 inline-block rounded bg-primary text-primary-foreground px-3 py-1 text-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  Einreichen
                </button>
              )}
              {user?.role === 'AUSBILDER' && report.status === 'EINGEREICHT' && (
                <div className="mt-2 space-x-2">
                  <button
                    onClick={() => handleApprove(report.id)}
                    disabled={submitting}
                    className="rounded bg-green-600 text-white px-3 py-1 text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    Freigeben
                  </button>
                  <button
                    onClick={() => handleRequestChanges(report.id)}
                    disabled={submitting}
                    className="rounded bg-red-600 text-white px-3 py-1 text-sm hover:bg-red-700 disabled:opacity-50"
                  >
                    Zurück
                  </button>
                </div>
              )}
            </div>
          ))}
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}