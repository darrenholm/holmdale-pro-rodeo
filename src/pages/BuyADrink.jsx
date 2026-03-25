import { useState } from 'react';
import { useFeatureFlags } from '@/lib/useFeatureFlags';

const API = 'https://rodeo-fresh-production-7348.up.railway.app/api';
const nfcSupported = typeof window !== 'undefined' && 'NDEFReader' in window;

async function lookupWristband(uid) {
  const res = await fetch(`${API}/wristbands/balance/${encodeURIComponent(uid)}`);
  if (!res.ok) throw new Error((await res.json()).error || 'Wristband not found');
  return res.json();
}

async function doTransfer(sender_uid, recipient_uid, amount) {
  const res = await fetch(`${API}/wristbands/transfer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender_uid, recipient_uid, amount }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Transfer failed');
  return res.json();
}

async function scanNFC() {
  const reader = new window.NDEFReader();
  await reader.scan();
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Scan timed out — try again')), 15000);
    reader.onreading = (event) => { clearTimeout(timeout); resolve(event.serialNumber?.toUpperCase() || ''); };
    reader.onerror = (e) => { clearTimeout(timeout); reject(new Error(e.message || 'NFC read error')); };
  });
}

const STEPS = { GIVER: 'giver', AMOUNT: 'amount', RECIPIENT: 'recipient', DONE: 'done' };

export default function BuyADrink() {
  const { data: flags, isLoading: flagsLoading } = useFeatureFlags();
  const [step, setStep] = useState(STEPS.GIVER);
  const [giverUid, setGiverUid] = useState('');
  const [giverData, setGiverData] = useState(null);
  const [amount, setAmount] = useState(1);
  const [recipientUid, setRecipientUid] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualInput, setManualInput] = useState('');

  if (flagsLoading) return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 to-stone-900 flex items-center justify-center">
      <p className="text-amber-300 text-lg">Loading…</p>
    </div>
  );

  if (!flags?.buy_friend_drink?.enabled) return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 to-stone-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-5xl mb-4">🤠</div>
        <h1 className="text-2xl font-bold text-amber-400 mb-2">Coming Soon</h1>
        <p className="text-stone-400">This feature isn't available yet. Check back closer to the event!</p>
      </div>
    </div>
  );

  const reset = () => {
    setStep(STEPS.GIVER); setGiverUid(''); setGiverData(null);
    setAmount(1); setRecipientUid(''); setResult(null);
    setError(''); setManualInput('');
  };

  const handleNFCScan = async (forStep) => {
    setError(''); setLoading(true);
    try {
      const uid = await scanNFC();
      if (!uid) throw new Error('Could not read wristband UID');
      const data = await lookupWristband(uid);
      if (forStep === STEPS.GIVER) { setGiverUid(uid); setGiverData(data); setStep(STEPS.AMOUNT); }
      else { setRecipientUid(uid); await confirmTransfer(giverUid, uid, amount); }
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleManualLookup = async (forStep) => {
    if (!manualInput.trim()) return;
    setError(''); setLoading(true);
    try {
      const uid = manualInput.trim().toUpperCase();
      const data = await lookupWristband(uid);
      if (forStep === STEPS.GIVER) { setGiverUid(uid); setGiverData(data); setStep(STEPS.AMOUNT); }
      else { setRecipientUid(uid); await confirmTransfer(giverUid, uid, amount); }
      setManualInput('');
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const confirmTransfer = async (senderUid, recipUid, qty) => {
    try {
      const res = await doTransfer(senderUid, recipUid, qty);
      setResult(res); setStep(STEPS.DONE);
    } catch (e) { setError(e.message); }
  };

  const remaining = giverData ? giverData.remaining : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-900 to-stone-900 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🍺</div>
          <h1 className="text-3xl font-bold text-amber-400">Buy a Friend a Drink</h1>
          <p className="text-amber-200 mt-1 text-sm">Transfer drink tickets wristband to wristband</p>
        </div>
        <div className="flex justify-center gap-3 mb-8">
          {[STEPS.GIVER, STEPS.AMOUNT, STEPS.RECIPIENT, STEPS.DONE].map((s, i) => (
            <div key={s} className={`w-3 h-3 rounded-full transition-all ${
              step === s ? 'bg-amber-400 scale-125' :
              [STEPS.GIVER, STEPS.AMOUNT, STEPS.RECIPIENT, STEPS.DONE].indexOf(step) > i ? 'bg-amber-600' : 'bg-stone-600'
            }`} />
          ))}
        </div>
        <div className="bg-stone-800 rounded-2xl p-6 shadow-2xl border border-stone-700">
          {step === STEPS.GIVER && (
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <h2 className="text-xl font-semibold text-white mb-2">Step 1: Your Wristband</h2>
              <p className="text-stone-400 text-sm mb-6">{nfcSupported ? 'Tap your wristband to the back of your phone, or enter the ID manually below.' : 'Enter your wristband ID below.'}</p>
              {nfcSupported && (
                <button onClick={() => handleNFCScan(STEPS.GIVER)} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold py-4 rounded-xl text-lg mb-4 transition-all">
                  {loading ? '📡 Scanning…' : '📡 Tap Wristband'}
                </button>
              )}
              <div className="flex gap-2">
                <input value={manualInput} onChange={e => setManualInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleManualLookup(STEPS.GIVER)} placeholder="Wristband ID (e.g. A3F2B1)" className="flex-1 bg-stone-700 text-white placeholder-stone-500 border border-stone-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500" />
                <button onClick={() => handleManualLookup(STEPS.GIVER)} disabled={loading || !manualInput.trim()} className="bg-stone-600 hover:bg-stone-500 disabled:opacity-40 text-white px-4 rounded-xl transition-all">Go</button>
              </div>
            </div>
          )}
          {step === STEPS.AMOUNT && giverData && (
            <div className="text-center">
              <div className="text-4xl mb-3">🎟️</div>
              <h2 className="text-xl font-semibold text-white mb-1">Step 2: How Many Drinks?</h2>
              <p className="text-stone-400 text-sm mb-1">Hi <span className="text-amber-300 font-medium">{giverData.customer_name || 'there'}</span>!</p>
              <p className="text-stone-400 text-sm mb-6">You have <span className="text-amber-400 font-bold">{remaining}</span> drink{remaining !== 1 ? 's' : ''} remaining.</p>
              <div className="flex items-center justify-center gap-6 mb-6">
                <button onClick={() => setAmount(a => Math.max(1, a - 1))} className="w-12 h-12 rounded-full bg-stone-700 hover:bg-stone-600 text-white text-2xl font-bold transition-all">−</button>
                <div className="text-5xl font-bold text-amber-400 w-16">{amount}</div>
                <button onClick={() => setAmount(a => Math.min(remaining, a + 1))} disabled={amount >= remaining} className="w-12 h-12 rounded-full bg-stone-700 hover:bg-stone-600 disabled:opacity-30 text-white text-2xl font-bold transition-all">+</button>
              </div>
              <div className="flex justify-center gap-2 mb-6">
                {[1,2,3,5].filter(n => n <= remaining).map(n => (
                  <button key={n} onClick={() => setAmount(n)} className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${amount === n ? 'bg-amber-500 text-stone-900' : 'bg-stone-700 text-stone-300 hover:bg-stone-600'}`}>{n}</button>
                ))}
              </div>
              <button onClick={() => setStep(STEPS.RECIPIENT)} disabled={amount < 1 || amount > remaining} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold py-4 rounded-xl text-lg transition-all">
                Gift {amount} Drink{amount !== 1 ? 's' : ''} →
              </button>
            </div>
          )}
          {step === STEPS.RECIPIENT && (
            <div className="text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h2 className="text-xl font-semibold text-white mb-2">Step 3: Friend's Wristband</h2>
              <p className="text-stone-400 text-sm mb-1">Gifting <span className="text-amber-400 font-bold">{amount} drink{amount !== 1 ? 's' : ''}</span> to your friend.</p>
              <p className="text-stone-400 text-sm mb-6">{nfcSupported ? "Have your friend tap their wristband to your phone, or enter their ID below." : "Enter your friend's wristband ID below."}</p>
              {nfcSupported && (
                <button onClick={() => handleNFCScan(STEPS.RECIPIENT)} disabled={loading} className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-stone-900 font-bold py-4 rounded-xl text-lg mb-4 transition-all">
                  {loading ? '📡 Scanning…' : "📡 Tap Friend's Wristband"}
                </button>
              )}
              <div className="flex gap-2">
                <input value={manualInput} onChange={e => setManualInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleManualLookup(STEPS.RECIPIENT)} placeholder="Friend's Wristband ID" className="flex-1 bg-stone-700 text-white placeholder-stone-500 border border-stone-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500" />
                <button onClick={() => handleManualLookup(STEPS.RECIPIENT)} disabled={loading || !manualInput.trim()} className="bg-stone-600 hover:bg-stone-500 disabled:opacity-40 text-white px-4 rounded-xl transition-all">Go</button>
              </div>
              <button onClick={() => setStep(STEPS.AMOUNT)} className="mt-4 text-stone-500 hover:text-stone-300 text-sm transition-all">← Change amount</button>
            </div>
          )}
          {step === STEPS.DONE && result && (
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-amber-400 mb-2">Drinks Sent!</h2>
              <p className="text-stone-300 text-sm mb-6"><span className="text-amber-300 font-medium">{result.transfer.to.name}</span> just got <span className="text-amber-400 font-bold">{result.transfer.amount} drink{result.transfer.amount !== 1 ? 's' : ''}</span> on you. Cheers! 🤠</p>
              <div className="bg-stone-700 rounded-xl p-4 text-left text-sm mb-6">
                <div className="flex justify-between text-stone-400 mb-1"><span>From</span><span className="text-white">{result.transfer.from.name}</span></div>
                <div className="flex justify-between text-stone-400 mb-1"><span>To</span><span className="text-white">{result.transfer.to.name}</span></div>
                <div className="flex justify-between text-stone-400 mb-1"><span>Drinks gifted</span><span className="text-amber-400 font-bold">{result.transfer.amount}</span></div>
                <div className="flex justify-between text-stone-400 border-t border-stone-600 pt-2 mt-2"><span>Your remaining balance</span><span className="text-white">{result.transfer.from.remaining}</span></div>
              </div>
              <button onClick={reset} className="w-full bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold py-4 rounded-xl text-lg transition-all">Send Another Round</button>
            </div>
          )}
          {error && <div className="mt-4 bg-red-900/50 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm text-center">{error}</div>}
        </div>
        {!nfcSupported && <p className="text-center text-stone-500 text-xs mt-4">NFC wristband tapping requires Android Chrome. On iPhone, use the manual ID entry above.</p>}
      </div>
    </div>
  );
}
