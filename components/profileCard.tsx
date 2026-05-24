'use client';

import { useState, useRef, useCallback } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { toast } from 'sonner';

type Tab = 'profile' | 'security';

type User = {
  name: string;
  email: string;
  image?: string | null;
};

// ── icons (inline SVG to avoid extra deps) ──────────────────────────────────
const UserIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CameraIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
  </svg>
);

const PencilIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const EyeIcon = ({ show }: { show: boolean }) =>
  show ? (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );

// ────── crop helper (circular, 1:1) ─────────────────────────────────────────────────────────────────

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.setAttribute('crossOrigin', 'anonymous');
    img.src = url;
  });
}

function getRadianAngle(deg: number) {
  return (deg * Math.PI) / 180;
}

async function getCroppedCircleBlob(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob | null> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const rotRad = getRadianAngle(rotation);
  const bBoxW =
    Math.abs(Math.cos(rotRad) * image.width) +
    Math.abs(Math.sin(rotRad) * image.height);
  const bBoxH =
    Math.abs(Math.sin(rotRad) * image.width) +
    Math.abs(Math.cos(rotRad) * image.height);

  canvas.width = bBoxW;
  canvas.height = bBoxH;
  ctx.translate(bBoxW / 2, bBoxH / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const cropped = document.createElement('canvas');
  const size = Math.min(pixelCrop.width, pixelCrop.height);
  cropped.width = size;
  cropped.height = size;

  const croppedCtx = cropped.getContext('2d');
  if (!croppedCtx) return null;

  // Clip to circle
  croppedCtx.beginPath();
  croppedCtx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  croppedCtx.clip();

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    size,
    size
  );

  return new Promise((resolve) =>
    cropped.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92)
  );
}

// ── AvatarCropModal ──────────────────────────────────────────────────────────

function AvatarCropModal({
  rawUrl,
  onSave,
  onCancel,
}: {
  rawUrl: string;
  onSave: (blob: Blob, previewUrl: string) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  async function handleSave() {
    if (!croppedAreaPixels) return;
    setSaving(true);
    const blob = await getCroppedCircleBlob(
      rawUrl,
      croppedAreaPixels,
      rotation
    );
    if (blob) {
      const previewUrl = URL.createObjectURL(blob);
      onSave(blob, previewUrl);
    }
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            Adjust profile photo
          </h3>
          <button
            onClick={onCancel}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cancel"
          >
            <XIcon />
          </button>
        </div>

        {/* Cropper */}
        <div className="relative h-64 w-full overflow-hidden rounded-xl bg-gray-900">
          <Cropper
            image={rawUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Zoom</span>
            <span className="text-xs text-gray-400">
              {Math.round(zoom * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600"
            aria-label="Zoom"
          />
        </div>

        {/* Rotation slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Rotation</span>
            <span className="text-xs text-gray-400">{rotation}°</span>
          </div>
          <input
            type="range"
            min={-180}
            max={180}
            step={1}
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600"
            aria-label="Rotation"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-400/30 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? <Spinner /> : null}
            {saving ? 'Saving…' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}
// ── small reusable field ─────────────────────────────────────────────────────
function Field({
  label,
  id,
  type = 'text',
  value,
  onChange,
  placeholder,
  hint,
  showToggle,
  onToggle,
  showing,
  readOnly,
}: {
  label: string;
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  showToggle?: boolean;
  onToggle?: () => void;
  showing?: boolean;
  readOnly?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={showToggle ? (showing ? 'text' : 'password') : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition-all outline-none placeholder:text-gray-400 read-only:cursor-default read-only:bg-gray-100 read-only:text-gray-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100 read-only:focus:border-gray-200 read-only:focus:ring-0"
        />
        {showToggle && (
          <button
            title="butt"
            type="button"
            onClick={onToggle}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
            tabIndex={-1}
          >
            <EyeIcon show={!!showing} />
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

// ── password strength bar ────────────────────────────────────────────────────
function StrengthBar({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = [
    '',
    'bg-red-400',
    'bg-amber-400',
    'bg-blue-400',
    'bg-emerald-400',
  ];
  const textColors = [
    '',
    'text-red-500',
    'text-amber-500',
    'text-blue-500',
    'text-emerald-500',
  ];

  if (!password) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? colors[score] : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <span className={`text-xs font-medium ${textColors[score]}`}>
        {labels[score]}
      </span>
    </div>
  );
}

// ── main component ───────────────────────────────────────────────────────────
export default function AccountCard({ user }: { user: User }) {
  const [tab, setTab] = useState<Tab>('profile');

  // profile state
  const [username, setUsername] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [editingUsername, setEditingUsername] = useState(false);
  const [draftUsername, setDraftUsername] = useState('');
  const [avatarSrc, setAvatarSrc] = useState<string | null>(user.image ?? null);
  const [rawAvatarUrl, setRawAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  // security state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [securitySaving, setSecuritySaving] = useState(false);
  const [securitySaved, setSecuritySaved] = useState(false);
  const [pwError, setPwError] = useState('');

  const initials = username
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    const objectUrl = URL.createObjectURL(file);
    setRawAvatarUrl(objectUrl);
  }

  async function handleAvatarUpload(blob: Blob, previewUrl: string) {
    setRawAvatarUrl(null);
    setAvatarSrc(previewUrl);
    setAvatarUploading(true);
    try {
      const formData = new FormData();
      formData.append('imageFile', blob, 'avatar.jpg');
      const res = await fetch('/api/user', {
        method: 'PUT',
        credentials: 'include',
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? 'Failed to upload avatar.');
      }
    } catch (err) {
      console.error(err);
      setAvatarSrc(user.image ?? null);
      toast.error('An error occurred while uploading your avatar.');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleProfileSave() {
    setProfileSaving(true);
    setProfileSaved(false);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: draftUsername }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update profile.');
      }
      setUsername(draftUsername);
      setEditingUsername(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (error) {
      console.error(error);
      alert('An error occurred while updating your profile.');
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSecuritySave() {
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match.');
      return;
    }
    if (newPw.length < 8) {
      setPwError('Password must be at least 8 characters.');
      return;
    }

    setSecuritySaving(true);
    setSecuritySaved(false);
    try {
      const res = await fetch('/api/user/change-password', {
        // ← adjust path to match your route
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: currentPw,
          newPassword: newPw,
          confirmPassword: confirmPw, // include if your schema requires it
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setPwError(err.message ?? 'Something went wrong.');
        return;
      }

      setSecuritySaved(true);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => setSecuritySaved(false), 2500);
    } catch {
      setPwError('Network error. Please try again.');
    } finally {
      setSecuritySaving(false);
    }
  }

  return (
    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl ring-1 shadow-blue-900/10 ring-black/5">
      {/* ── tab bar ── */}
      <div className="flex border-b border-gray-100 bg-gray-50/60">
        {(['profile', 'security'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative flex flex-1 items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
              tab === t ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'profile' ? <UserIcon /> : <LockIcon />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {tab === t && (
              <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-blue-500" />
            )}
          </button>
        ))}
      </div>

      {/* ── profile tab ── */}
      {tab === 'profile' && (
        <div className="flex flex-col gap-6 p-6">
          {/* avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-blue-500 ring-4 ring-blue-100">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-white">
                    {initials}
                  </span>
                )}
                {/* uploading spinner overlay*/}
                {avatarUploading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/30">
                    <Spinner />
                  </div>
                )}
              </div>
              <button
                onClick={() => !avatarUploading && fileRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white shadow-md shadow-blue-400/40 transition-colors hover:bg-blue-700"
                aria-label="Change profile photo"
              >
                <CameraIcon />
              </button>
              <input
                aria-label="input"
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <p className="text-xs text-gray-400">JPG, PNG or GIF · max 5 MB</p>
          </div>
          {/* Crop modal — rendered outside the avatar div to avoid clipping */}
          {rawAvatarUrl && (
            <AvatarCropModal
              rawUrl={rawAvatarUrl}
              onSave={handleAvatarUpload}
              onCancel={() => {
                URL.revokeObjectURL(rawAvatarUrl);
                setRawAvatarUrl(null);
              }}
            />
          )}

          {/* fields */}
          <div className="flex flex-col gap-4">
            {/* username with inline edit */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="username"
                className="text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    id="username"
                    type="text"
                    value={editingUsername ? draftUsername : username}
                    onChange={(e) => setDraftUsername(e.target.value)}
                    readOnly={!editingUsername}
                    placeholder="Your display name"
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm text-gray-900 transition-all outline-none placeholder:text-gray-400 ${
                      editingUsername
                        ? 'border-blue-400 bg-white ring-2 ring-blue-100'
                        : 'cursor-default border-gray-200 bg-gray-100 text-gray-400'
                    }`}
                  />
                </div>
                {editingUsername ? (
                  <div className="flex gap-1">
                    <button
                      onClick={handleProfileSave}
                      disabled={profileSaving}
                      className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500 text-white shadow-sm transition-all hover:bg-blue-700 active:scale-95 disabled:opacity-60"
                      aria-label="Save username"
                    >
                      {profileSaving ? <Spinner /> : <CheckIcon />}
                    </button>
                    <button
                      onClick={() => {
                        setEditingUsername(false);
                        setDraftUsername(username);
                      }}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition-colors hover:text-gray-600"
                      aria-label="Cancel"
                    >
                      <XIcon />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditingUsername(true);
                      setDraftUsername(username);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition-colors hover:border-blue-300 hover:text-blue-500"
                    aria-label="Edit username"
                  >
                    <PencilIcon />
                  </button>
                )}
              </div>
              {profileSaved && (
                <p className="text-xs font-medium text-emerald-500">
                  ✓ Username updated!
                </p>
              )}
            </div>
            <Field
              label="Email address"
              id="email"
              type="email"
              value={email}
              onChange={() => {}}
              placeholder="you@example.com"
              readOnly
            />
          </div>
        </div>
      )}

      {/* ── security tab ── */}
      {tab === 'security' && (
        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-4">
            <Field
              label="Current password"
              id="currentPw"
              value={currentPw}
              onChange={setCurrentPw}
              placeholder="Enter current password"
              showToggle
              onToggle={() => setShowCurrent((v) => !v)}
              showing={showCurrent}
            />
            <div className="flex flex-col gap-1.5">
              <Field
                label="New password"
                id="newPw"
                value={newPw}
                onChange={setNewPw}
                placeholder="Min. 8 characters"
                showToggle
                onToggle={() => setShowNew((v) => !v)}
                showing={showNew}
              />
              <StrengthBar password={newPw} />
            </div>
            <Field
              label="Confirm new password"
              id="confirmPw"
              value={confirmPw}
              onChange={setConfirmPw}
              placeholder="Re-enter new password"
              showToggle
              onToggle={() => setShowConfirm((v) => !v)}
              showing={showConfirm}
            />
          </div>

          {pwError && (
            <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-500 ring-1 ring-red-200">
              {pwError}
            </p>
          )}

          <button
            onClick={handleSecuritySave}
            disabled={securitySaving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-400/30 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {securitySaving ? (
              <>
                <Spinner /> Updating…
              </>
            ) : securitySaved ? (
              '✓ Password updated!'
            ) : (
              'Update password'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
