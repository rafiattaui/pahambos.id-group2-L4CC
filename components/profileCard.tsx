'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

type Tab = 'profile' | 'security';

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
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition-all outline-none placeholder:text-gray-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
        />
        {showToggle && (
          <button
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
export default function ProfileCard() {
  const [tab, setTab] = useState<Tab>('profile');

  // profile state
  const [username, setUsername] = useState('CoolNinja');
  const [email, setEmail] = useState('coolninja@example.com');
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
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
    const reader = new FileReader();
    reader.onload = () => setAvatarSrc(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleProfileSave() {
    setProfileSaving(true);
    setProfileSaved(false);
    // TODO: wire up to your server action / API route
    await new Promise((r) => setTimeout(r, 900));
    setProfileSaving(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  async function handleSecuritySave() {
    setPwError('');
    if (!currentPw || !newPw || !confirmPw) {
      setPwError('All fields are required.');
      return;
    }
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
    // TODO: wire up to your server action / API route
    await new Promise((r) => setTimeout(r, 900));
    setSecuritySaving(false);
    setSecuritySaved(true);
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setTimeout(() => setSecuritySaved(false), 2500);
  }

  return (
    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl ring-1 shadow-violet-900/10 ring-black/5">
      {/* ── tab bar ── */}
      <div className="flex border-b border-gray-100 bg-gray-50/60">
        {(['profile', 'security'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative flex flex-1 items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${
              tab === t
                ? 'text-violet-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'profile' ? <UserIcon /> : <LockIcon />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {tab === t && (
              <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-t-full bg-violet-500" />
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
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 ring-4 ring-violet-100">
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
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white shadow-md shadow-violet-400/40 transition-colors hover:bg-violet-700"
                aria-label="Change profile photo"
              >
                <CameraIcon />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <p className="text-xs text-gray-400">JPG, PNG or GIF · max 5 MB</p>
          </div>

          {/* fields */}
          <div className="flex flex-col gap-4">
            <Field
              label="Username"
              id="username"
              value={username}
              onChange={setUsername}
              placeholder="Your display name"
            />
            <Field
              label="Email address"
              id="email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              hint="We'll send a verification link if you change this."
            />
          </div>

          <button
            onClick={handleProfileSave}
            disabled={profileSaving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-400/30 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {profileSaving ? (
              <>
                <Spinner /> Saving…
              </>
            ) : profileSaved ? (
              '✓ Saved!'
            ) : (
              'Save changes'
            )}
          </button>
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-violet-400/30 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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
