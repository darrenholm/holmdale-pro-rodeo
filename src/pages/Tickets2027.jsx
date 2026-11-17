/**
 * Tickets2027 — 2027 named tickets + Christmas hoodie bundles.
 * Spec: rodeo-fresh/SPEC-2027-named-tickets.md (step 2).
 *
 * Flow: 1 Choose tickets → 2 Names (+ hoodie size/colour) → 3 Delivery & pay
 * → Moneris → done. Prices are HST-included and come from the API; the
 * server re-prices everything, so nothing here is trusted for money.
 *
 * Talks only to PUBLIC endpoints (no staff auto-login):
 *   GET  /tickets-2027/catalog
 *   POST /moneris/named-ticket-checkout
 *   POST /moneris/confirm-payment
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Gift, Minus, Plus, Trash2, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { api } from '@/api/railwayClient';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

const money = c => `$${(c / 100).toFixed(c % 100 ? 2 : 0)}`;
const DAY_KEYS = ['fri', 'sat', 'sun'];
let uidSeq = 0;
const newUnit = (type, day) => ({
  uid: ++uidSeq,
  code: type.code,
  day: type.validFor === 'day' ? day : null,
  attendees: [...Array(type.adults + type.children)].map(() => ({ name: '', is19: false })),
  hoodies: [...Array(type.hoodies || 0)].map(() => ({ size: '', colour: '' }))
});

function unitPrice(type, day) {
  return type.validFor === 'day' ? type.dayPrices?.[day] : type.priceCents;
}

export default function Tickets2027() {
  const [catalog, setCatalog] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [step, setStep] = useState(1);
  const [units, setUnits] = useState([]);
  const [buyer, setBuyer] = useState({ name: '', email: '', phone: '' });
  const [shipping, setShipping] = useState({ method: '', address: { street: '', city: '', province: 'ON', postal_code: '' } });
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [checkoutTicket, setCheckoutTicket] = useState(null);
  const [done, setDone] = useState(null);
  const [payError, setPayError] = useState(null);
  const codeRef = useRef(null);

  // ── Load what's on sale ──
  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).get('preview');
    api.publicGet(`/tickets-2027/catalog${preview ? `?preview=${encodeURIComponent(preview)}` : ''}`)
      .then(setCatalog)
      .catch(err => setLoadError(err.message || 'Could not load tickets'));
  }, []);

  const types = catalog?.types || [];
  const byCode = useMemo(() => Object.fromEntries(types.map(t => [t.code, t])), [types]);
  const bundles = types.filter(t => t.isBundle);
  const dayTypes = types.filter(t => !t.isBundle && t.validFor === 'day');
  const weekendTypes = types.filter(t => !t.isBundle && t.validFor === 'weekend');
  const hasHoodies = units.some(u => (byCode[u.code]?.hoodies || 0) > 0);

  const ticketsTotal = units.reduce((s, u) => s + (unitPrice(byCode[u.code], u.day) || 0), 0);

  // Live ShipTime price once the address is complete (server re-quotes at checkout).
  const [shipQuote, setShipQuote] = useState(null); // { cents, label } | 'loading' | null
  const addr = shipping.address;
  const addrReady = hasHoodies && shipping.method === 'ship'
    && addr.street.trim() && addr.city.trim() && addr.province.trim() && addr.postal_code.trim().length >= 6;
  useEffect(() => {
    if (!addrReady) { setShipQuote(null); return; }
    setShipQuote('loading');
    const t = setTimeout(() => {
      api.publicPost('/tickets-2027/shipping-quote', {
        buyer, shipping: { method: 'ship', address: { ...addr, name: buyer.name } },
        items: units.map(u => ({ code: u.code, day: u.day, attendees: u.attendees, hoodies: u.hoodies }))
      }).then(r => setShipQuote({ cents: r.shipping_cents, label: r.label }))
        .catch(() => setShipQuote({ cents: catalog?.shipFlatCents || 0, label: 'Shipping' }));
    }, 600);
    return () => clearTimeout(t);
  }, [addrReady, addr.street, addr.city, addr.province, addr.postal_code, units.length]);

  const shipCents = hasHoodies && shipping.method === 'ship' && shipQuote && shipQuote !== 'loading' ? shipQuote.cents : 0;
  const total = ticketsTotal + shipCents;

  // ── Moneris ──
  useEffect(() => {
    if (!document.getElementById('moneris-checkout-script')) {
      const s = document.createElement('script');
      s.id = 'moneris-checkout-script';
      s.src = 'https://gateway.moneris.com/chkt/js/chkt_v1.00.js';
      s.async = true;
      document.body.appendChild(s);
    }
  }, []);

  useEffect(() => {
    if (!checkoutTicket || typeof window.monerisCheckout === 'undefined') return;
    const mc = new window.monerisCheckout();
    mc.setMode('prod');
    mc.setCheckoutDiv('monerisCheckout');
    mc.setCallback('cancel_transaction', () => setCheckoutTicket(null));
    mc.setCallback('error_event', () => { setCheckoutTicket(null); setPayError('A payment error occurred. You have not been charged.'); });
    mc.setCallback('payment_receipt', async () => {
      try {
        await api.publicPost('/moneris/confirm-payment', { confirmation_code: codeRef.current });
        setDone({ code: codeRef.current, email: buyer.email });
      } catch (err) {
        setPayError(err.status === 402 ? 'Your card was declined. You have not been charged.'
          : err.status === 404 ? 'Your checkout session expired before payment could be confirmed. Please contact us before trying again.'
          : 'We could not confirm your payment. Please contact info@holmdalerodeo.ca with your email address.');
      }
      setCheckoutTicket(null);
    });
    mc.startCheckout(checkoutTicket);
    return () => { try { mc.closeCheckout?.(); } catch { /* already closed */ } };
  }, [checkoutTicket]);

  // ── Cart editing ──
  const add = (type, day) => setUnits(u => [...u, newUnit(type, day)]);
  const removeOne = (code, day) => setUnits(u => {
    const i = u.map(x => `${x.code}|${x.day}`).lastIndexOf(`${code}|${day}`);
    return i < 0 ? u : [...u.slice(0, i), ...u.slice(i + 1)];
  });
  const count = (code, day) => units.filter(u => u.code === code && u.day === day).length;
  const setAttendee = (uid, i, patch) => setUnits(us => us.map(u => u.uid !== uid ? u
    : { ...u, attendees: u.attendees.map((a, j) => j === i ? { ...a, ...patch } : a) }));
  const setHoodie = (uid, i, patch) => setUnits(us => us.map(u => u.uid !== uid ? u
    : { ...u, hoodies: u.hoodies.map((h, j) => j === i ? { ...h, ...patch } : h) }));
  const sameAsBuyer = () => {
    if (!units.length) return;
    setAttendee(units[0].uid, 0, { name: buyer.name });
  };

  // ── Step checks (server checks again) ──
  function checkNames() {
    if (!buyer.name.trim()) return 'Enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email.trim())) return 'Enter a valid email so we can send your tickets';
    for (const u of units) for (const h of u.hoodies) if (!h.size || !h.colour) return 'Pick a size and colour for each hoodie';
    return null;
  }
  function checkDelivery() {
    if (!hasHoodies) return null;
    if (!shipping.method) return 'Choose shipping or pickup for the hoodie';
    if (shipping.method === 'ship') {
      const a = shipping.address;
      if (!a.street.trim() || !a.city.trim() || !a.province.trim() || !a.postal_code.trim()) return 'Enter the full shipping address';
      if (!shipQuote || shipQuote === 'loading') return 'One moment, still getting the shipping price';
    }
    return null;
  }
  const next = (check, to) => { const e = check(); setFormError(e); if (!e) { setStep(to); window.scrollTo(0, 0); } };

  async function pay() {
    const e = checkNames() || checkDelivery();
    if (e) { setFormError(e); return; }
    setFormError(null); setPayError(null); setBusy(true);
    try {
      const res = await api.publicPost('/moneris/named-ticket-checkout', {
        buyer,
        items: units.map(u => ({ code: u.code, day: u.day, attendees: u.attendees, hoodies: u.hoodies })),
        shipping: hasHoodies ? { method: shipping.method, address: { ...shipping.address, name: buyer.name } } : null
      });
      codeRef.current = res.confirmation_code;
      setCheckoutTicket(res.ticket);
    } catch (err) {
      let msg = 'Checkout could not be started. Please try again.';
      try { msg = JSON.parse(err.details).error || msg; } catch { /* keep default */ }
      setFormError(msg);
    } finally {
      setBusy(false);
    }
  }

  // ── Screens ──
  const shell = children => (
    <div className="min-h-screen bg-stone-950 pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">{children}</div>
    </div>
  );

  if (done) return shell(
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">You're all set!</h1>
      <p className="text-stone-300">Order <span className="font-mono text-amber-400">{done.code}</span></p>
      <p className="text-stone-400 mt-3">Your tickets and QR code are on their way to <span className="text-white">{done.email}</span>. Use the <b>Manage names</b> button in that email to fill in or change names any time before the rodeo.</p>
      <Link to={createPageUrl('Home')}><Button className="mt-6 bg-amber-400 hover:bg-amber-500 text-stone-900">Back to Home</Button></Link>
    </div>
  );

  if (loadError) return shell(
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center">
      <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
      <p className="text-white">Tickets couldn't be loaded. Please refresh the page.</p>
    </div>
  );

  if (!catalog) return shell(<div className="text-stone-400 flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading tickets…</div>);

  if (!types.length) return shell(
    <div className="bg-stone-900 border border-stone-800 rounded-2xl p-8 text-center">
      <Ticket className="w-12 h-12 text-stone-600 mx-auto mb-3" />
      <h1 className="text-xl font-semibold text-white">2027 tickets aren't on sale yet</h1>
      <p className="text-stone-400 mt-2">Holmdale Pro Rodeo · Civic Holiday weekend, July 30 – August 1, 2027. Check back soon!</p>
    </div>
  );

  const header = (
    <div className="mb-6">
      <h1 className="text-3xl font-bold text-white">2027 Tickets</h1>
      <p className="text-stone-400">Holmdale Pro Rodeo · July 30 – August 1, 2027 · All prices include HST</p>
      <div className="flex gap-2 mt-4 text-sm">
        {['Choose', 'Names', 'Pay'].map((s, i) => (
          <span key={s} className={`px-3 py-1 rounded-full ${step === i + 1 ? 'bg-amber-400 text-stone-900 font-semibold' : 'bg-stone-800 text-stone-400'}`}>{i + 1}. {s}</span>
        ))}
      </div>
    </div>
  );

  const errorBox = (formError || payError) && (
    <div className="mb-4 rounded-lg border border-red-800 bg-red-950/60 text-red-200 px-4 py-3 flex gap-2">
      <AlertCircle className="w-5 h-5 shrink-0" />{formError || payError}
    </div>
  );

  const totalBar = (label, onClick, disabled) => (
    <div className="sticky bottom-0 mt-6 -mx-4 sm:mx-0 bg-stone-900/95 backdrop-blur border-t sm:border sm:rounded-xl border-stone-800 px-4 py-3 flex items-center justify-between gap-3">
      <div>
        <div className="text-white font-bold text-lg">{money(total)}</div>
        <div className="text-stone-400 text-xs">{units.length} item{units.length === 1 ? '' : 's'}{shipCents ? ' + shipping' : ''} · HST included</div>
      </div>
      <Button disabled={disabled} onClick={onClick} className="bg-amber-400 hover:bg-amber-500 text-stone-900 font-semibold">{label}</Button>
    </div>
  );

  const counter = (type, day) => {
    const price = unitPrice(type, day);
    if (!Number.isInteger(price)) return null;
    const n = count(type.code, day);
    return (
      <div key={day || 'w'} className="flex items-center justify-between gap-2 bg-stone-950/60 rounded-lg px-3 py-2">
        <div className="text-sm">
          <span className="text-white">{day ? catalog.days[day].label : 'Fri–Sun'}</span>
          <span className="text-amber-400 font-semibold ml-2">{price === 0 ? 'Free' : money(price)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button aria-label="Remove one" disabled={!n} onClick={() => removeOne(type.code, day)} className="w-8 h-8 rounded-full bg-stone-800 text-white disabled:opacity-30 flex items-center justify-center"><Minus className="w-4 h-4" /></button>
          <span className="w-5 text-center text-white">{n}</span>
          <button aria-label="Add one" onClick={() => add(type, day)} className="w-8 h-8 rounded-full bg-amber-400 text-stone-900 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
        </div>
      </div>
    );
  };

  const typeCard = type => (
    <div key={type.code} className={`rounded-xl border p-4 ${type.isBundle ? 'border-amber-500/50 bg-amber-950/20' : 'border-stone-800 bg-stone-900'}`}>
      <div className="flex items-start gap-3 mb-3">
        {type.isBundle ? <Gift className="w-5 h-5 text-amber-400 mt-0.5" /> : <Ticket className="w-5 h-5 text-stone-400 mt-0.5" />}
        <div>
          <h3 className="text-white font-semibold">{type.label}</h3>
          {type.description && <p className="text-stone-400 text-sm">{type.description}</p>}
          {!type.description && (type.adults + type.children > 1) && <p className="text-stone-400 text-sm">{type.adults} adults + {type.children} youth</p>}
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-2">
        {type.validFor === 'day' ? DAY_KEYS.map(d => counter(type, d)) : counter(type, null)}
      </div>
    </div>
  );

  // Step 1: choose
  if (step === 1) return shell(<>
    {header}
    {errorBox}
    {bundles.length > 0 && <section className="mb-8">
      <h2 className="text-amber-400 font-semibold mb-1 flex items-center gap-2"><Gift className="w-5 h-5" /> Christmas Gear Up bundles</h2>
      {bundles[0].onSaleTo && <p className="text-stone-400 text-sm mb-3">Ticket + Rodeo Hoodie. On sale until {new Date(bundles[0].onSaleTo).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', timeZone: 'America/Toronto' })}.</p>}
      <div className="space-y-3">{bundles.map(typeCard)}</div>
    </section>}
    {dayTypes.length > 0 && <section className="mb-8">
      <h2 className="text-white font-semibold mb-3">Day tickets</h2>
      <div className="space-y-3">{dayTypes.map(typeCard)}</div>
    </section>}
    {weekendTypes.length > 0 && <section className="mb-8">
      <h2 className="text-white font-semibold mb-3">Weekend passes · Good all three days</h2>
      <div className="space-y-3">{weekendTypes.map(typeCard)}</div>
    </section>}
    {totalBar('Next: names', () => next(() => (units.length ? null : 'Add at least one ticket'), 2), !units.length)}
  </>);

  // Step 2: names + hoodies
  const blankNo = { adult: 0, youth: 0 };
  if (step === 2) return shell(<>
    {header}
    {errorBox}
    <section className="rounded-xl border border-stone-800 bg-stone-900 p-4 mb-6">
      <h2 className="text-white font-semibold mb-3">Your details</h2>
      <div className="grid sm:grid-cols-3 gap-3">
        <Input placeholder="Your name" value={buyer.name} onChange={e => setBuyer({ ...buyer, name: e.target.value })} className="bg-stone-950 border-stone-700 text-white" />
        <Input type="email" placeholder="Email (tickets go here)" value={buyer.email} onChange={e => setBuyer({ ...buyer, email: e.target.value })} className="bg-stone-950 border-stone-700 text-white" />
        <Input type="tel" placeholder="Phone" value={buyer.phone} onChange={e => setBuyer({ ...buyer, phone: e.target.value })} className="bg-stone-950 border-stone-700 text-white" />
      </div>
    </section>

    <section className="mb-2">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-white font-semibold">Who's coming?</h2>
        <button onClick={sameAsBuyer} className="text-amber-400 text-sm underline">First ticket is me</button>
      </div>
      <p className="text-stone-400 text-sm mb-3">One name per wristband. Buying a gift? Leave names blank and fill them in later from your email.</p>
      <div className="space-y-3">
        {units.map(u => {
          const t = byCode[u.code];
          return (
            <div key={u.uid} className="rounded-xl border border-stone-800 bg-stone-900 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-white font-medium">{t.label}{u.day ? ` · ${catalog.days[u.day].label}` : ''}</div>
                <button aria-label="Remove" onClick={() => setUnits(us => us.filter(x => x.uid !== u.uid))} className="text-stone-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
              {u.attendees.map((a, i) => {
                const isChild = i >= t.adults;
                const n = ++blankNo[isChild ? 'youth' : 'adult'];
                return (
                  <div key={i} className="flex items-center gap-3 py-1.5">
                    <Input placeholder={`${isChild ? 'Youth' : 'Adult'} name (or leave as ${isChild ? 'Youth' : 'Adult'} ${n})`} value={a.name}
                      onChange={e => setAttendee(u.uid, i, { name: e.target.value })} className="bg-stone-950 border-stone-700 text-white" />
                    {isChild
                      ? <span className="text-stone-500 text-xs w-14 shrink-0">Youth</span>
                      : <label className="flex items-center gap-1.5 text-stone-300 text-sm w-14 shrink-0 cursor-pointer">
                          <Checkbox checked={a.is19} onCheckedChange={v => setAttendee(u.uid, i, { is19: v === true })} />19+
                        </label>}
                  </div>
                );
              })}
              {u.hoodies.map((h, i) => (
                <div key={`h${i}`} className="mt-3 pt-3 border-t border-stone-800 grid grid-cols-2 gap-3">
                  <select aria-label="Hoodie colour" value={h.colour} onChange={e => setHoodie(u.uid, i, { colour: e.target.value })} className="h-9 rounded-md bg-stone-950 border border-stone-700 text-white px-2">
                    <option value="">Hoodie colour…</option>
                    {(t.product?.colors || []).map(c => <option key={c}>{c}</option>)}
                  </select>
                  <select aria-label="Hoodie size" value={h.size} onChange={e => setHoodie(u.uid, i, { size: e.target.value })} className="h-9 rounded-md bg-stone-950 border border-stone-700 text-white px-2">
                    <option value="">Hoodie size…</option>
                    {(t.product?.sizes || []).map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              ))}
            </div>
          );
        })}
      </div>
      <p className="text-stone-400 text-xs mt-3">Age may be verified at the gate. Bring ID if 19+ is checked.</p>
    </section>
    <button onClick={() => setStep(1)} className="text-stone-400 text-sm mt-4 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to tickets</button>
    {totalBar('Next: pay', () => next(checkNames, 3), !units.length)}
  </>);

  // Step 3: delivery + pay
  return shell(<>
    {header}
    {errorBox}
    {hasHoodies && <section className="rounded-xl border border-stone-800 bg-stone-900 p-4 mb-6">
      <h2 className="text-white font-semibold mb-3">Hoodie delivery</h2>
      <div className="grid sm:grid-cols-2 gap-3 mb-3">
        {[['ship', 'Ship it to me'], ['pickup', 'Pick up · free']].map(([m, label]) => (
          <button key={m} onClick={() => { setShipping({ ...shipping, method: m }); setFormError(null); }}
            className={`rounded-lg border px-3 py-3 text-left ${shipping.method === m ? 'border-amber-400 bg-amber-950/30 text-white' : 'border-stone-700 text-stone-300'}`}>{label}</button>
        ))}
      </div>
      {shipping.method === 'pickup' && <p className="text-stone-400 text-sm">We'll email you when it's ready to pick up.</p>}
      {shipping.method === 'ship' && <div className="grid sm:grid-cols-2 gap-3">
        {[['street', 'Street address'], ['city', 'City / town'], ['province', 'Province'], ['postal_code', 'Postal code']].map(([k, ph]) => (
          <Input key={k} placeholder={ph} value={shipping.address[k]} className="bg-stone-950 border-stone-700 text-white"
            onChange={e => setShipping({ ...shipping, address: { ...shipping.address, [k]: e.target.value } })} />
        ))}
        <p className="text-stone-400 text-sm sm:col-span-2">
          {shipQuote === 'loading' ? 'Getting shipping price…'
            : shipQuote ? <>Shipping: <span className="text-white font-semibold">{money(shipQuote.cents)}</span> {shipQuote.label !== 'Shipping' && <span>· {shipQuote.label.replace(/^Shipping \(|\)$/g, '')}</span>}</>
            : 'Enter your address to see the shipping price.'}
        </p>
      </div>}
    </section>}

    <section className="rounded-xl border border-stone-800 bg-stone-900 p-4">
      <h2 className="text-white font-semibold mb-3">Order summary</h2>
      {units.map(u => {
        const t = byCode[u.code];
        return (
          <div key={u.uid} className="flex justify-between text-sm py-1 text-stone-300">
            <span>{t.label}{u.day ? ` · ${catalog.days[u.day].label}` : ''}</span><span>{money(unitPrice(t, u.day))}</span>
          </div>
        );
      })}
      {shipCents > 0 && <div className="flex justify-between text-sm py-1 text-stone-300"><span>Shipping</span><span>{money(shipCents)}</span></div>}
      <div className="flex justify-between border-t border-stone-800 mt-2 pt-2 text-white font-bold"><span>Total (HST included)</span><span>{money(total)}</span></div>
    </section>

    <div id="monerisCheckout" className={checkoutTicket ? 'mt-6 bg-white rounded-xl min-h-[500px]' : ''} />

    {!checkoutTicket && <>
      <button onClick={() => setStep(2)} className="text-stone-400 text-sm mt-4 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to names</button>
      {totalBar(busy ? 'Starting…' : 'Pay now', pay, busy || !units.length)}
    </>}
  </>);
}
