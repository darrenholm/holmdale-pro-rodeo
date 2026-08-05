import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Camera, Upload, X, ChevronLeft, ChevronRight, Loader2,
  CheckCircle2, AlertCircle, ImageIcon
} from 'lucide-react';
import {
  fetchPublicPhotos, fetchPublicAlbums, fetchUploadInfo, uploadPhoto, ACCEPTED_TYPES
} from '@/lib/photoUpload';

const PAGE_SIZE = 60;

export default function Photos() {
  const [albums, setAlbums] = useState([]);
  const [activeAlbum, setActiveAlbum] = useState('');
  const [photos, setPhotos] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  useEffect(() => {
    fetchPublicAlbums().then(setAlbums).catch(() => setAlbums([]));
  }, []);

  const load = useCallback(async (album, offset = 0) => {
    offset === 0 ? setLoading(true) : setLoadingMore(true);
    try {
      const data = await fetchPublicPhotos({ album, limit: PAGE_SIZE, offset });
      setPhotos(prev => (offset === 0 ? data.photos : [...prev, ...data.photos]));
      setTotal(data.total);
      setError(null);
    } catch {
      setError('We could not load the photo gallery just now. Please try again shortly.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { load(activeAlbum, 0); }, [activeAlbum, load]);

  const hasMore = photos.length < total;

  return (
    <div className="min-h-screen bg-stone-950">
      <section className="relative pt-32 pb-12 px-6">
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900 to-stone-950" />
        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.span
            className="inline-block text-green-500 text-sm font-semibold tracking-wider uppercase mb-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Holmdale Pro Rodeo
          </motion.span>
          <motion.h1
            className="text-4xl md:text-6xl font-bold text-white mb-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            Photo Gallery
          </motion.h1>
          <motion.p
            className="text-stone-400 max-w-2xl mx-auto mb-8"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
            Moments from the chutes, the stands and everywhere in between. Got a great
            shot of your own? We would love to see it.
          </motion.p>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <Button
              onClick={() => setUploadOpen(true)}
              className="bg-green-500 hover:bg-green-600 text-stone-900 font-semibold gap-2">
              <Camera className="w-4 h-4" />
              Share Your Photos
            </Button>
          </motion.div>
        </div>
      </section>

      {albums.length > 0 && (
        <div className="px-6 max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-2 justify-center pb-8">
            <AlbumChip active={activeAlbum === ''} onClick={() => setActiveAlbum('')}>
              All Photos
            </AlbumChip>
            {albums.map(a => (
              <AlbumChip
                key={a.id}
                active={activeAlbum === a.slug}
                onClick={() => setActiveAlbum(a.slug)}>
                {a.name}
                {a.year ? <span className="opacity-60"> {a.year}</span> : null}
                <span className="opacity-50 ml-1.5">{a.photo_count}</span>
              </AlbumChip>
            ))}
          </div>
        </div>
      )}

      <section className="px-6 pb-24 max-w-6xl mx-auto">
        {loading ? (
          <GridSkeleton />
        ) : error ? (
          <EmptyState icon={AlertCircle} title="Gallery unavailable" body={error} />
        ) : photos.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="No photos here yet"
            body="Photos are added after each event. If you were there with a camera, use Share Your Photos above — we would love to feature your shots." />
        ) : (
          <>
            {/* Fixed-height rows rather than a masonry layout: the thumbnails
                arrive at mixed aspect ratios and a uniform grid keeps the page
                from reflowing as each one decodes. */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {photos.map((photo, i) => (
                <motion.button
                  key={photo.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i, 12) * 0.02 }}
                  onClick={() => setLightboxIndex(i)}
                  className="group relative aspect-square overflow-hidden rounded-lg bg-stone-900 focus:outline-none focus:ring-2 focus:ring-green-500">
                  <img
                    src={photo.thumb_url}
                    alt={photo.caption || 'Holmdale Pro Rodeo photo'}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {photo.credit && (
                    <span className="absolute bottom-2 left-2 right-2 text-[11px] text-stone-200 text-left opacity-0 group-hover:opacity-100 transition-opacity truncate">
                      📷 {photo.credit}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-10">
                <Button
                  variant="outline"
                  disabled={loadingMore}
                  onClick={() => load(activeAlbum, photos.length)}
                  className="border-stone-700 text-stone-300 hover:bg-stone-800 hover:text-white">
                  {loadingMore
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading…</>
                    : `Load more (${total - photos.length} left)`}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            photos={photos}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {uploadOpen && (
          <UploadDialog
            onClose={() => setUploadOpen(false)}
            onDone={() => load(activeAlbum, 0)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function AlbumChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        active
          ? 'bg-green-500 text-stone-900'
          : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
      }`}>
      {children}
    </button>
  );
}

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="aspect-square rounded-lg bg-stone-900 animate-pulse" />
      ))}
    </div>
  );
}

function EmptyState({ icon: Icon, title, body }) {
  return (
    <div className="text-center py-24">
      <Icon className="w-12 h-12 text-stone-700 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-stone-400 max-w-md mx-auto">{body}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Lightbox
// ─────────────────────────────────────────────────────────────

function Lightbox({ photos, index, onClose, onNavigate }) {
  const photo = photos[index];

  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index < photos.length - 1) onNavigate(index + 1);
      if (e.key === 'ArrowLeft' && index > 0) onNavigate(index - 1);
    };
    window.addEventListener('keydown', onKey);
    // Stop the gallery behind the overlay from scrolling under the fixed layer.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [index, photos.length, onClose, onNavigate]);

  if (!photo) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[60] bg-stone-950/97 flex items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}>
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 p-2 text-stone-400 hover:text-white">
        <X className="w-7 h-7" />
      </button>

      {index > 0 && (
        <NavArrow side="left" onClick={e => { e.stopPropagation(); onNavigate(index - 1); }} />
      )}
      {index < photos.length - 1 && (
        <NavArrow side="right" onClick={e => { e.stopPropagation(); onNavigate(index + 1); }} />
      )}

      <div
        className="max-w-6xl w-full px-4 md:px-16 flex flex-col items-center"
        onClick={e => e.stopPropagation()}>
        <img
          key={photo.id}
          src={photo.web_url}
          alt={photo.caption || 'Holmdale Pro Rodeo photo'}
          className="max-h-[78vh] w-auto max-w-full object-contain rounded-lg" />
        <div className="mt-4 text-center max-w-2xl">
          {photo.caption && <p className="text-stone-200">{photo.caption}</p>}
          <p className="text-sm text-stone-500 mt-1">
            {photo.credit && <>Photo by {photo.credit}</>}
            {photo.credit && photo.taken_at && ' · '}
            {photo.taken_at && new Date(photo.taken_at).toLocaleDateString('en-CA', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
          </p>
          <p className="text-xs text-stone-600 mt-3">{index + 1} of {photos.length}</p>
        </div>
      </div>
    </motion.div>
  );
}

function NavArrow({ side, onClick }) {
  const Icon = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      onClick={onClick}
      aria-label={side === 'left' ? 'Previous photo' : 'Next photo'}
      className={`absolute ${side === 'left' ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 z-10 p-3 text-stone-400 hover:text-white`}>
      <Icon className="w-8 h-8" />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
//  Public upload
// ─────────────────────────────────────────────────────────────

const emptyItem = file => ({
  file,
  // A stable key: two files can share a name, and index changes as items are removed.
  key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
  progress: 0,
  status: 'queued', // queued | uploading | done | error
  error: null
});

function UploadDialog({ onClose, onDone }) {
  const [info, setInfo] = useState(null);
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [caption, setCaption] = useState('');
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [finished, setFinished] = useState(false);
  const [formError, setFormError] = useState(null);
  const fileInput = useRef(null);

  useEffect(() => {
    fetchUploadInfo().then(setInfo).catch(() =>
      setFormError('Photo uploads are temporarily unavailable.'));
  }, []);

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const maxBytes = info?.max_bytes ?? 60 * 1024 * 1024;

  const addFiles = useCallback(files => {
    const picked = Array.from(files);
    const accepted = [];
    const rejected = [];

    for (const file of picked) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        rejected.push(`${file.name} is not an image we can accept`);
      } else if (file.size > maxBytes) {
        rejected.push(`${file.name} is larger than ${Math.round(maxBytes / 1048576)} MB`);
      } else {
        accepted.push(emptyItem(file));
      }
    }
    // 20 at a time keeps a phone from running out of memory building derivatives.
    setItems(prev => [...prev, ...accepted].slice(0, 20));
    setFormError(rejected.length ? rejected.join('. ') : null);
  }, [maxBytes]);

  const removeItem = key => setItems(prev => prev.filter(i => i.key !== key));

  const patchItem = (key, patch) =>
    setItems(prev => prev.map(i => (i.key === key ? { ...i, ...patch } : i)));

  const submit = async () => {
    setFormError(null);
    if (!items.length) return setFormError('Please choose at least one photo.');
    if (name.trim().length < 2) return setFormError('Please enter your name.');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      return setFormError('Please enter a valid email address.');
    }
    if (!consent) return setFormError('Please tick the permission box to submit.');

    setBusy(true);
    let anySucceeded = false;

    // Sequential, not parallel: each upload holds a full-resolution file plus two
    // canvases in memory, and the grounds' cellular uplink is the bottleneck
    // anyway — running them at once just makes every bar crawl.
    for (const item of items) {
      if (item.status === 'done') continue;
      patchItem(item.key, { status: 'uploading', progress: 0, error: null });
      try {
        await uploadPhoto(
          item.file,
          {
            uploader_name: name.trim(),
            uploader_email: email.trim(),
            consent: true,
            caption: caption.trim() || null
          },
          { onProgress: p => patchItem(item.key, { progress: p }) }
        );
        patchItem(item.key, { status: 'done', progress: 1 });
        anySucceeded = true;
      } catch (err) {
        patchItem(item.key, { status: 'error', error: err.message });
      }
    }

    setBusy(false);
    if (anySucceeded) {
      setFinished(true);
      onDone?.();
    } else {
      setFormError('None of the photos uploaded. Please check your connection and try again.');
    }
  };

  const uploadsDisabled = info && info.enabled === false;

  return (
    <motion.div
      className="fixed inset-0 z-[70] bg-stone-950/90 overflow-y-auto p-4 md:p-8"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="max-w-2xl mx-auto bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden"
        initial={{ y: 20 }} animate={{ y: 0 }}>
        <div className="flex items-start justify-between p-6 border-b border-stone-800">
          <div>
            <h2 className="text-xl font-bold text-white">Share Your Rodeo Photos</h2>
            <p className="text-sm text-stone-400 mt-1">
              Your photos go to our team for a quick look before they appear in the gallery.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="text-stone-500 hover:text-white disabled:opacity-40 p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {finished ? (
          <div className="p-10 text-center">
            <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Thank you!</h3>
            <p className="text-stone-400 max-w-sm mx-auto">
              {items.filter(i => i.status === 'done').length} photo
              {items.filter(i => i.status === 'done').length === 1 ? '' : 's'} received.
              Our team will review {items.filter(i => i.status === 'done').length === 1 ? 'it' : 'them'} and
              add {items.filter(i => i.status === 'done').length === 1 ? 'it' : 'them'} to the gallery shortly.
            </p>
            <Button onClick={onClose} className="mt-6 bg-green-500 hover:bg-green-600 text-stone-900 font-semibold">
              Done
            </Button>
          </div>
        ) : uploadsDisabled ? (
          <div className="p-10 text-center">
            <AlertCircle className="w-12 h-12 text-stone-600 mx-auto mb-4" />
            <p className="text-stone-400">
              Photo uploads are temporarily unavailable. Please check back soon.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            <div
              onClick={() => !busy && fileInput.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); if (!busy) addFiles(e.dataTransfer.files); }}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                busy
                  ? 'border-stone-800 cursor-default'
                  : 'border-stone-700 hover:border-green-500 hover:bg-green-500/5 cursor-pointer'
              }`}>
              <Upload className="w-8 h-8 text-stone-500 mx-auto mb-3" />
              <p className="text-stone-300 font-medium">Tap to choose photos</p>
              <p className="text-sm text-stone-500 mt-1">
                or drag them here · up to {Math.round(maxBytes / 1048576)} MB each, 20 at a time
              </p>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                multiple
                className="hidden"
                onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
            </div>

            {items.length > 0 && (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {items.map(item => (
                  <FileRow key={item.key} item={item} onRemove={() => removeItem(item.key)} busy={busy} />
                ))}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="up-name" className="text-stone-300">Your name</Label>
                <Input
                  id="up-name" value={name} disabled={busy}
                  onChange={e => setName(e.target.value)}
                  placeholder="Jane Smith"
                  className="mt-1.5 bg-stone-950 border-stone-700 text-white" />
              </div>
              <div>
                <Label htmlFor="up-email" className="text-stone-300">Email</Label>
                <Input
                  id="up-email" type="email" value={email} disabled={busy}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  className="mt-1.5 bg-stone-950 border-stone-700 text-white" />
                <p className="text-xs text-stone-600 mt-1">
                  Only so we can reach you about your photos. Never shown publicly.
                </p>
              </div>
            </div>

            <div>
              <Label htmlFor="up-caption" className="text-stone-300">
                Caption <span className="text-stone-600">(optional)</span>
              </Label>
              <Textarea
                id="up-caption" value={caption} disabled={busy}
                onChange={e => setCaption(e.target.value)}
                placeholder="Saturday night bull riding — what a ride!"
                rows={2}
                className="mt-1.5 bg-stone-950 border-stone-700 text-white" />
            </div>

            <label className="flex items-start gap-3 p-4 rounded-xl bg-stone-950 border border-stone-800 cursor-pointer">
              <Checkbox
                checked={consent} disabled={busy}
                onCheckedChange={v => setConsent(Boolean(v))}
                className="mt-0.5 border-stone-600 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />
              <span className="text-sm text-stone-300 leading-relaxed">
                {info?.consent_text ||
                  'I took this photo (or have the right to share it) and I give Holmdale Pro Rodeo permission to use it in their marketing, website, social media and promotional materials, with credit where practical.'}
              </span>
            </label>

            {formError && (
              <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex gap-3 justify-end pt-1">
              <Button
                variant="ghost" onClick={onClose} disabled={busy}
                className="text-stone-400 hover:text-white hover:bg-stone-800">
                Cancel
              </Button>
              <Button
                onClick={submit} disabled={busy || !items.length}
                className="bg-green-500 hover:bg-green-600 text-stone-900 font-semibold gap-2">
                {busy
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Uploading…</>
                  : <><Upload className="w-4 h-4" />Submit {items.length || ''} photo{items.length === 1 ? '' : 's'}</>}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function FileRow({ item, onRemove, busy }) {
  const pct = Math.round(item.progress * 100);
  return (
    <div className="flex items-center gap-3 bg-stone-950 rounded-lg px-3 py-2.5 border border-stone-800">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-300 truncate">{item.file.name}</span>
          <span className="text-xs text-stone-600 shrink-0">
            {(item.file.size / 1048576).toFixed(1)} MB
          </span>
        </div>
        {item.status === 'uploading' && (
          <div className="h-1 bg-stone-800 rounded-full mt-1.5 overflow-hidden">
            <div className="h-full bg-green-500 transition-all duration-200" style={{ width: `${pct}%` }} />
          </div>
        )}
        {item.status === 'error' && (
          <p className="text-xs text-red-400 mt-1">{item.error}</p>
        )}
      </div>
      {item.status === 'done' && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
      {item.status === 'uploading' && (
        <span className="text-xs text-stone-500 shrink-0 tabular-nums">{pct}%</span>
      )}
      {item.status === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />}
      {item.status === 'queued' && !busy && (
        <button onClick={onRemove} aria-label="Remove" className="text-stone-600 hover:text-red-400 shrink-0">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
