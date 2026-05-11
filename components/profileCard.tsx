'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { set } from 'zod';

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
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition-all outline-none placeholder:text-gray-400 read-only:cursor-default read-only:bg-gray-100 read-only:text-gray-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 read-only:focus:border-gray-200 read-only:focus:ring-0"
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

// ── main component ───────────────────────────────────────────────────────────
export default function AccountCard({ user }: { user: User }) {
  // profile state
  const [username, setUsername] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [editingUsername, setEditingUsername] = useState(false);
  const [draftUsername, setDraftUsername] = useState('');
  const [avatarSrc, setAvatarSrc] = useState<string | null>(user.image ?? null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

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
    try {
      const res = await fetch('api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: draftUsername }),
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

  return (
    <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl ring-1 shadow-violet-900/10 ring-black/5">
      {/* ── profile screen ── */}
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
                      ? 'border-violet-400 bg-white ring-2 ring-violet-100'
                      : 'cursor-default border-gray-200 bg-gray-100 text-gray-400'
                  }`}
                />
              </div>
              {editingUsername ? (
                <div className="flex gap-1">
                  <button
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm transition-all hover:bg-violet-700 active:scale-95 disabled:opacity-60"
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
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-400 transition-colors hover:border-violet-300 hover:text-violet-500"
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
