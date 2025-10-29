"use client";

import { useEffect, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { add, format, parse, startOfWeek, getDay } from 'date-fns';
import de from 'date-fns/locale/de';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import ReportPanel from '@/app/components/ReportPanel';

interface DayStatus {
  status: 'RED' | 'YELLOW' | 'GREEN' | 'NONE';
}

interface CalendarApiResponse {
  statuses: Record<string, DayStatus>;
}

const locales = { de };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

/**
 * Calendar page.  Displays an interactive calendar with day color coding based on
 * report statuses.  Clicking on a day opens a side panel where users can
 * create or review reports.  The calendar updates automatically when
 * statuses change.
 */
export default function CalendarPage() {
  const [dayStatuses, setDayStatuses] = useState<Record<string, DayStatus>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatuses() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/calendar');
        if (res.ok) {
          const data: CalendarApiResponse = await res.json();
          setDayStatuses(data.statuses);
        } else {
          const d = await res.json();
          setError(d.error || 'Fehler beim Laden des Kalenders');
        }
      } catch {
        setError('Netzwerkfehler');
      } finally {
        setLoading(false);
      }
    }
    fetchStatuses();
  }, []);

  // Determine the CSS class for a calendar cell based on its date
  function dayPropGetter(date: Date) {
    const key = format(date, 'yyyy-MM-dd');
    const status = dayStatuses[key]?.status || 'NONE';
    let className = '';
    if (status === 'RED') className = 'bg-red-100';
    else if (status === 'YELLOW') className = 'bg-yellow-100';
    else if (status === 'GREEN') className = 'bg-green-100';
    return {
      className,
      // Add an ARIA label for accessibility
      'aria-label': `Status ${status}`,
    };
  }

  // Handler when a day is clicked
  function handleSelectSlot({ start }: { start: Date }) {
    const iso = format(start, 'yyyy-MM-dd');
    setSelectedDate(iso);
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Berichtsheft Kalender</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      {/* Show loading text until statuses have been fetched */}
      {loading && <p>Kalender wird geladen…</p>}
      {!loading && (
        <Calendar
          localizer={localizer}
          events={[]}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 600 }}
          views={['month', 'week', 'day']}
          selectable
          onSelectSlot={handleSelectSlot}
          dayPropGetter={dayPropGetter}
        />
      )}
      {selectedDate && (
        <ReportPanel
          isoDate={selectedDate}
          onClose={() => setSelectedDate(null)}
        />
      )}
    </main>
  );
}