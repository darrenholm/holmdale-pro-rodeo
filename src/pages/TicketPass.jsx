/**
 * TicketPass — /t/:token. This is what the order QR code opens when someone
 * scans it with a phone camera. It shows who the order covers and who has
 * checked in. Read-only; names are changed from the Manage names link.
 * (Gate staff scan the same QR with the SmartPDA gate screen — build step 4.)
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, Ticket } from 'lucide-react';
import { api } from '@/api/railwayClient';

export default function TicketPass() {
  const { token } = useParams();
  const [view, setView] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.publicGet(`/tickets-2027/pass/${encodeURIComponent(token)}`)
      .then(setView)
      .catch(() => setError('Ticket not found. Check the QR code in your ticket email.'));
  }, [token]);

  const shell = children => (
    <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">{children}</div>
    </div>
  );

  if (error) return shell(
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" /><p className="text-white">{error}</p>
    </div>
  );
  if (!view) return shell(<div className="text-stone-400 flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading…</div>);

  const dayText = d => (d ? view.days[d].label : 'Weekend – Fri, Sat & Sun');
  return shell(<>
    <div className="flex items-center gap-3 mb-1">
      <Ticket className="w-7 h-7 text-amber-400" />
      <h1 className="text-2xl font-bold text-white">Holmdale Pro Rodeo 2027</h1>
    </div>
    <p className="text-stone-400">Order <span className="font-mono text-amber-400">{view.confirmationCode}</span> · July 30 – August 1, 2027</p>
    <p className="text-stone-300 text-sm mt-3">Show this QR code at the gate. We print a wristband for each person below.</p>
    <div className="mt-5 space-y-2">
      {view.tickets.map(t => (
        <div key={t.id} className="rounded-xl border border-stone-800 bg-stone-900 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-white font-medium">{t.name}{t.is19 && <span className="ml-2 text-amber-400 text-xs">19+</span>}</div>
            <div className="text-stone-400 text-xs">{t.label}{t.seatKind === 'child' ? ' · Youth' : ''} · {dayText(t.day)}</div>
          </div>
          <span className={`text-xs font-semibold shrink-0 ${t.status === 'checked_in' ? 'text-green-400' : t.status === 'void' ? 'text-red-400' : 'text-stone-400'}`}>
            {t.status === 'checked_in' ? 'Checked in' : t.status === 'void' ? 'Cancelled' : 'Not yet checked in'}
          </span>
        </div>
      ))}
    </div>
  </>);
}
