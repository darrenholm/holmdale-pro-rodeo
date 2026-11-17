/**
 * ManageTickets — /tickets/manage/:token (private link from the order email).
 * Buyer changes names and 19+ on any ticket not yet checked in, and can
 * resend the ticket email. No login: the long random token is the key.
 * Spec: rodeo-fresh/SPEC-2027-named-tickets.md ("Manage names page").
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle, Lock, Mail } from 'lucide-react';
import { api } from '@/api/railwayClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const errText = (err, fallback) => { try { return JSON.parse(err.details).error || fallback; } catch { return fallback; } };

export default function ManageTickets() {
  const { token } = useParams();
  const [view, setView] = useState(null);
  const [edits, setEdits] = useState({});          // ticketId -> { name, is19 }
  const [loadError, setLoadError] = useState(null);
  const [msg, setMsg] = useState(null);            // { ok: bool, text }
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);

  const load = v => {
    setView(v);
    setEdits(Object.fromEntries(v.tickets.map(t => [t.id, { name: t.name, is19: t.is19 }])));
  };

  useEffect(() => {
    api.publicGet(`/tickets-2027/manage/${encodeURIComponent(token)}`)
      .then(load)
      .catch(err => setLoadError(errText(err, 'Could not load your tickets.')));
  }, [token]);

  const dirty = view && view.tickets.some(t =>
    t.status === 'open' && (edits[t.id]?.name.trim() !== t.name || edits[t.id]?.is19 !== t.is19));

  async function save() {
    setSaving(true); setMsg(null);
    try {
      const changes = view.tickets.filter(t => t.status === 'open')
        .map(t => ({ id: t.id, name: edits[t.id].name, is19: edits[t.id].is19 }));
      const res = await api.publicRequest(`/tickets-2027/manage/${encodeURIComponent(token)}`,
        { method: 'PUT', body: { tickets: changes } });
      load(res);
      setMsg({ ok: true, text: res.changed
        ? `Saved. We've emailed your updated tickets to ${res.buyerEmail}.`
        : 'Nothing changed.' });
    } catch (err) {
      setMsg({ ok: false, text: errText(err, 'Could not save. Please try again.') });
    } finally {
      setSaving(false);
    }
  }

  async function resend() {
    setResending(true); setMsg(null);
    try {
      const r = await api.publicPost(`/tickets-2027/manage/${encodeURIComponent(token)}/resend`, {});
      setMsg({ ok: true, text: `Ticket email sent to ${r.email}. Check your spam folder if it doesn't show up.` });
    } catch (err) {
      setMsg({ ok: false, text: errText(err, 'Could not resend. Please try again.') });
    } finally {
      setResending(false);
    }
  }

  const shell = children => (
    <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">{children}</div>
    </div>
  );

  if (loadError) return shell(
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
      <p className="text-white">{loadError}</p>
      <p className="text-stone-400 text-sm mt-2">Questions? info@holmdalerodeo.ca</p>
    </div>
  );
  if (!view) return shell(<div className="text-stone-400 flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading your tickets…</div>);

  const dayText = d => (d ? view.days[d].label : 'Weekend – Fri, Sat & Sun');

  return shell(<>
    <h1 className="text-3xl font-bold text-white">Manage names</h1>
    <p className="text-stone-400">Order <span className="font-mono text-amber-400">{view.confirmationCode}</span> · {view.buyerName}</p>
    <p className="text-stone-400 text-sm mt-2">
      {view.locked
        ? <span className="flex items-center gap-1.5"><Lock className="w-4 h-4" /> Names can no longer be changed online. Contact info@holmdalerodeo.ca for help.</span>
        : 'Change any name until that person’s wristband is printed at the gate. Age may be verified at the gate, so bring ID if 19+ is checked.'}
    </p>

    {msg && <div className={`mt-4 rounded-lg border px-4 py-3 flex gap-2 ${msg.ok ? 'border-green-800 bg-green-950/50 text-green-200' : 'border-red-800 bg-red-950/60 text-red-200'}`}>
      {msg.ok ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}{msg.text}
    </div>}

    <div className="mt-6 space-y-2">
      {view.tickets.map(t => {
        const editable = t.status === 'open' && !view.locked;
        const e = edits[t.id] || { name: t.name, is19: t.is19 };
        return (
          <div key={t.id} className="rounded-xl border border-stone-800 bg-stone-900 p-3">
            <div className="text-stone-400 text-xs mb-1.5">
              {t.label}{t.seatKind === 'child' ? ' · Youth' : ''} · {dayText(t.day)}
              {t.status === 'checked_in' && <span className="ml-2 text-green-400 font-semibold">Checked in</span>}
              {t.status === 'void' && <span className="ml-2 text-red-400 font-semibold">Cancelled</span>}
            </div>
            <div className="flex items-center gap-3">
              {editable
                ? <Input value={e.name} maxLength={160} aria-label="Name"
                    onChange={ev => setEdits({ ...edits, [t.id]: { ...e, name: ev.target.value } })}
                    className="bg-stone-950 border-stone-700 text-white" />
                : <div className="flex-1 text-white py-1.5">{t.name}</div>}
              {t.seatKind === 'adult'
                ? <label className={`flex items-center gap-1.5 text-sm w-14 shrink-0 ${editable ? 'text-stone-300 cursor-pointer' : 'text-stone-500'}`}>
                    <Checkbox checked={e.is19} disabled={!editable}
                      onCheckedChange={v => setEdits({ ...edits, [t.id]: { ...e, is19: v === true } })} />19+
                  </label>
                : <span className="text-stone-500 text-xs w-14 shrink-0">Youth</span>}
            </div>
          </div>
        );
      })}
    </div>

    {view.merch?.length > 0 && <div className="mt-6 rounded-xl border border-stone-800 bg-stone-900 p-4 text-sm text-stone-300">
      <h2 className="text-white font-semibold mb-2">Your gear</h2>
      {view.merch.map((m, i) => (
        <div key={i}>{m.name} – {m.colour}, {m.size} · {m.fulfilment === 'ship'
          ? (m.shipped ? 'Shipped' : 'Will be shipped')
          : (m.pickedUp ? 'Picked up' : 'For pickup')}</div>
      ))}
    </div>}

    <div className="mt-6 flex flex-wrap gap-3">
      {!view.locked && <Button onClick={save} disabled={!dirty || saving} className="bg-amber-400 hover:bg-amber-500 text-stone-900 font-semibold">
        {saving ? 'Saving…' : 'Save names'}
      </Button>}
      <Button onClick={resend} disabled={resending} variant="outline" className="border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-white">
        <Mail className="w-4 h-4 mr-1.5" />{resending ? 'Sending…' : 'Resend ticket email'}
      </Button>
    </div>
    <p className="text-stone-500 text-xs mt-6">Keep this link private: anyone with it can change the names on this order.</p>
  </>);
}
