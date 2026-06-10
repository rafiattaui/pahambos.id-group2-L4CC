'use client';

import React, { useEffect, useRef, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClassUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

interface Classroom {
  id: string;
  name: string;
  owner: ClassUser;
  members: ClassUser[];
}

// ─── API helper ───────────────────────────────────────────────────────────────

async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const json = await res.json();
    if (!res.ok) return { data: null, error: json.error ?? 'Request failed.' };
    return { data: json as T, error: null };
  } catch {
    return { data: null, error: 'Network error. Please try again.' };
  }
}

// ─── Palette ──────────────────────────────────────────────────────────────────

const CARD_GRADIENTS = [
  'from-violet-500 to-indigo-600',
  'from-sky-500 to-cyan-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
  'from-fuchsia-500 to-purple-600',
];

function cardGradient(id: string) {
  const idx =
    id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) %
    CARD_GRADIENTS.length;
  return CARD_GRADIENTS[idx];
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({
  name,
  size = 'md',
}: {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const colors = [
    'bg-violet-100 text-violet-700',
    'bg-blue-100 text-blue-700',
    'bg-pink-100 text-pink-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  const sz =
    size === 'lg'
      ? 'h-10 w-10 text-sm'
      : size === 'sm'
        ? 'h-7 w-7 text-xs'
        : 'h-8 w-8 text-xs';
  return (
    <div
      className={`${sz} ${color} flex shrink-0 items-center justify-center rounded-full font-bold`}
    >
      {initials}
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
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

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600 ring-1 ring-red-100">
      <span className="flex-1">{message}</span>
      <button onClick={onDismiss} className="shrink-0 hover:text-red-800">
        ✕
      </button>
    </div>
  );
}

// ─── Labeled input ────────────────────────────────────────────────────────────

function LabeledInput({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  disabled = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-500">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none disabled:opacity-50"
      />
    </div>
  );
}

// ─── Overlay ──────────────────────────────────────────────────────────────────

function Overlay({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/8">
        {children}
      </div>
    </div>
  );
}

function OverlayHeader({
  title,
  gradient,
  onClose,
}: {
  title: string;
  gradient: string;
  onClose: () => void;
}) {
  return (
    <div className={`relative bg-linear-to-br ${gradient} px-5 pt-5 pb-4`}>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <h2 className="mt-0.5 text-xl font-bold text-white">{title}</h2>
    </div>
  );
}

// ─── Class Card ───────────────────────────────────────────────────────────────

function ClassCard({
  cls,
  badge,
  onClick,
}: {
  cls: Classroom;
  badge?: React.ReactNode;
  onClick: () => void;
}) {
  const grad = cardGradient(cls.id);
  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col overflow-hidden rounded-2xl bg-white text-left shadow-md ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div
        className={`relative h-28 w-full bg-linear-to-br ${grad} flex items-end p-3`}
      >
        {badge && <span className="absolute top-3 left-3">{badge}</span>}
        <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
          {cls.members.length}{' '}
          {cls.members.length === 1 ? 'learner' : 'learners'}
        </span>
      </div>
      <div className="flex flex-col gap-1 p-4">
        <p className="truncate text-sm font-bold text-slate-800 transition group-hover:text-blue-700">
          {cls.name}
        </p>
        <p className="truncate text-xs text-slate-500">{cls.owner.name}</p>
      </div>
    </button>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  label,
  count,
  action,
}: {
  label: string;
  count: number;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-bold text-slate-800">{label}</h2>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
          {count}
        </span>
      </div>
      {action}
    </div>
  );
}

// ─── Section skeleton ─────────────────────────────────────────────────────────

function SectionSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/5"
        >
          <div className="h-28 w-full bg-slate-200" />
          <div className="flex flex-col gap-2 p-4">
            <div className="h-3.5 w-3/4 rounded-full bg-slate-200" />
            <div className="h-3 w-1/2 rounded-full bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Class ID display with copy button ───────────────────────────────────────

function ClassIdDisplay({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-black/5">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Class ID
        </p>
        <p className="font-mono text-xs break-all text-slate-600">{id}</p>
      </div>
      <button
        onClick={handleCopy}
        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
        title="Copy class ID"
      >
        {copied ? (
          <svg
            className="h-4 w-4 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        ) : (
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        )}
      </button>
    </div>
  );
}

// ─── Educator class detail overlay ───────────────────────────────────────────

function EducatorClassOverlay({
  cls,
  onClose,
  onUpdate,
  onDelete,
}: {
  cls: Classroom;
  onClose: () => void;
  onUpdate: (updated: Classroom) => void;
  onDelete: (id: string) => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState('');

  async function handleRename() {
    if (!editedName.trim()) return;
    setRenaming(true);
    setRenameError('');
    const { data, error } = await apiFetch<{ classroom: Classroom }>(
      '/api/class',
      {
        method: 'PATCH',
        body: JSON.stringify({ classroomId: cls.id, name: editedName.trim() }),
      }
    );
    setRenaming(false);
    if (error || !data) {
      setRenameError(error ?? 'Failed to rename.');
      return;
    }
    onUpdate(data.classroom);
    setEditingName(false);
    setEditedName('');
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError('');
    const { error } = await apiFetch('/api/class', {
      method: 'DELETE',
      body: JSON.stringify({ classroomId: cls.id }),
    });
    setDeleting(false);
    if (error) {
      setDeleteError(error);
      return;
    }
    onDelete(cls.id);
    onClose();
  }

  async function handleRemoveMember(memberId: string) {
    setRemovingId(memberId);
    setRemoveError('');
    const { error } = await apiFetch('/api/class', {
      method: 'DELETE',
      body: JSON.stringify({ classroomId: cls.id, memberId }),
    });
    setRemovingId(null);
    if (error) {
      setRemoveError(error);
      return;
    }
    onUpdate({ ...cls, members: cls.members.filter((m) => m.id !== memberId) });
  }

  return (
    <Overlay onClose={onClose}>
      <OverlayHeader
        title={editingName ? 'Rename Class' : cls.name}
        gradient={cardGradient(cls.id)}
        onClose={onClose}
      />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {/* Rename form */}
        {editingName ? (
          <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-black/5">
            <LabeledInput
              label="New Class Name"
              placeholder={cls.name}
              value={editedName}
              onChange={setEditedName}
              disabled={renaming}
            />
            {renameError && (
              <ErrorBanner
                message={renameError}
                onDismiss={() => setRenameError('')}
              />
            )}
            <div className="flex gap-2">
              <button
                onClick={handleRename}
                disabled={!editedName.trim() || renaming}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
              >
                {renaming && <Spinner />} Save
              </button>
              <button
                onClick={() => {
                  setEditingName(false);
                  setEditedName('');
                  setRenameError('');
                }}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          /* Action row */
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingName(true);
                setEditedName(cls.name);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536M9 11l6.586-6.586a2 2 0 112.828 2.828L11.828 13.828A2 2 0 0110 14H8v-2a2 2 0 01.586-1.414z"
                />
              </svg>
              Rename
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="ml-auto flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-40"
            >
              {deleting ? (
                <Spinner className="h-4 w-4 text-red-500" />
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              )}
              Delete
            </button>
          </div>
        )}

        {deleteError && (
          <ErrorBanner
            message={deleteError}
            onDismiss={() => setDeleteError('')}
          />
        )}

        {/* Class ID */}
        <ClassIdDisplay id={cls.id} />

        {/* Learner list */}
        <div>
          <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
            Learners · {cls.members.length}
          </p>
          {removeError && (
            <ErrorBanner
              message={removeError}
              onDismiss={() => setRemoveError('')}
            />
          )}
          {cls.members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center">
              <p className="text-sm text-slate-400">
                No learners have joined yet.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {cls.members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-black/5"
                >
                  <Avatar name={m.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {m.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">{m.email}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveMember(m.id)}
                    disabled={removingId === m.id}
                    className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                    title="Remove learner"
                  >
                    {removingId === m.id ? (
                      <Spinner />
                    ) : (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Overlay>
  );
}

// ─── Learner class detail overlay ─────────────────────────────────────────────

function LearnerClassOverlay({
  cls,
  onClose,
}: {
  cls: Classroom;
  onClose: () => void;
}) {
  return (
    <Overlay onClose={onClose}>
      <OverlayHeader
        title={cls.name}
        gradient={cardGradient(cls.id)}
        onClose={onClose}
      />
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {/* Educator */}
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-black/5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100">
            <svg
              className="h-4 w-4 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Educator
            </p>
            <p className="text-sm font-semibold text-slate-800">
              {cls.owner.name}
            </p>
          </div>
        </div>

        {/* Classmates */}
        <div>
          <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
            Classmates · {cls.members.length}
          </p>
          {cls.members.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center">
              <p className="text-sm text-slate-400">No classmates yet.</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {cls.members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-black/5"
                >
                  <Avatar name={m.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {m.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">{m.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Overlay>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ClassroomPage() {
  const [loadingOwned, setLoadingOwned] = useState(true);
  const [loadingJoined, setLoadingJoined] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const [ownedClasses, setOwnedClasses] = useState<Classroom[]>([]);
  const [joinedClasses, setJoinedClasses] = useState<Classroom[]>([]);

  // Track selected overlay via ref — avoids setState inside useEffect
  const selectedOwnedRef = useRef<Classroom | null>(null);
  const [selectedOwned, _setSelectedOwned] = useState<Classroom | null>(null);
  const [selectedJoined, setSelectedJoined] = useState<Classroom | null>(null);

  function setSelectedOwned(cls: Classroom | null) {
    selectedOwnedRef.current = cls;
    _setSelectedOwned(cls);
  }

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Join modal
  const [showJoin, setShowJoin] = useState(false);
  const [joinId, setJoinId] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinStatus, setJoinStatus] = useState<'idle' | 'success' | 'error'>(
    'idle'
  );
  const [joinError, setJoinError] = useState('');

  useEffect(() => {
    // Fetch owned (educator) classes
    apiFetch<{ educatorClasses: Classroom[] }>('/api/class?type=educator').then(
      ({ data, error }) => {
        setLoadingOwned(false);
        if (error || !data) {
          setFetchError(error ?? 'Failed to load classrooms.');
          return;
        }
        setOwnedClasses(data.educatorClasses);
      }
    );

    // Fetch joined (learner) classes independently
    apiFetch<{ learnerClasses: Classroom[] }>('/api/class?type=learner').then(
      ({ data, error }) => {
        setLoadingJoined(false);
        if (error || !data) {
          setFetchError(error ?? 'Failed to load classrooms.');
          return;
        }
        setJoinedClasses(data.learnerClasses);
      }
    );
  }, []);

  // Sync the open educator overlay when ownedClasses updates — no setState in useEffect
  function updateOwnedClasses(updater: (prev: Classroom[]) => Classroom[]) {
    setOwnedClasses((prev) => {
      const next = updater(prev);
      // Keep the open overlay in sync using the ref
      if (selectedOwnedRef.current) {
        const fresh = next.find((c) => c.id === selectedOwnedRef.current!.id);
        selectedOwnedRef.current = fresh ?? null;
        _setSelectedOwned(fresh ?? null);
      }
      return next;
    });
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError('');
    const { data, error } = await apiFetch<Classroom>('/api/class', {
      method: 'POST',
      body: JSON.stringify({ name: newName.trim() }),
    });
    setCreating(false);
    if (error || !data) {
      setCreateError(error ?? 'Failed to create class.');
      return;
    }
    setOwnedClasses((p) => [...p, data]);
    setNewName('');
    setShowCreate(false);
  }

  async function handleJoin() {
    if (!joinId.trim()) return;
    setJoining(true);
    setJoinError('');
    setJoinStatus('idle');
    const { data, error } = await apiFetch<{ classroom: Classroom }>(
      `/api/class/${joinId.trim()}`,
      {
        method: 'POST',
      }
    );
    setJoining(false);
    if (error || !data) {
      setJoinError(error ?? 'Failed to join class.');
      setJoinStatus('error');
      return;
    }
    setJoinedClasses((p) => {
      const exists = p.some((c) => c.id === data.classroom.id);
      return exists
        ? p.map((c) => (c.id === data.classroom.id ? data.classroom : c))
        : [...p, data.classroom];
    });
    setJoinStatus('success');
    setTimeout(() => {
      setJoinId('');
      setJoinStatus('idle');
      setShowJoin(false);
    }, 1200);
  }

  return (
    <div className="flex w-full items-start justify-center p-6">
      <div className="w-full max-w-7xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
        <div className="p-8">
          {fetchError ? (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 ring-1 ring-red-100">
              {fetchError}
            </div>
          ) : (
            <div className="flex flex-col gap-10">
              {/* ── My Classes (owned / educator) ── */}
              <section>
                <SectionHeader
                  label="My Classes"
                  count={loadingOwned ? 0 : ownedClasses.length}
                  action={
                    <button
                      onClick={() => {
                        setShowCreate(true);
                        setCreateError('');
                      }}
                      className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                      New Class
                    </button>
                  }
                />
                {loadingOwned ? (
                  <SectionSkeleton count={2} />
                ) : ownedClasses.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 py-12 text-center">
                    <p className="text-sm font-medium text-slate-500">
                      No classes yet
                    </p>
                    <p className="text-xs text-slate-400">
                      Create your first class to get started.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {ownedClasses.map((cls) => (
                      <ClassCard
                        key={cls.id}
                        cls={cls}
                        badge={
                          <span className="rounded-full bg-white/30 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur-sm">
                            Educator
                          </span>
                        }
                        onClick={() => setSelectedOwned(cls)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Divider */}
              <div className="border-t border-slate-100" />

              {/* ── Joined Classes (learner) ── */}
              <section>
                <SectionHeader
                  label="Joined Classes"
                  count={loadingJoined ? 0 : joinedClasses.length}
                  action={
                    <button
                      onClick={() => {
                        setShowJoin(true);
                        setJoinStatus('idle');
                        setJoinError('');
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 active:scale-95"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                        />
                      </svg>
                      Join Class
                    </button>
                  }
                />
                {loadingJoined ? (
                  <SectionSkeleton count={2} />
                ) : joinedClasses.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 py-12 text-center">
                    <p className="text-sm font-medium text-slate-500">
                      No joined classes yet
                    </p>
                    <p className="text-xs text-slate-400">
                      Use a classroom ID from your educator to join.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {joinedClasses.map((cls) => (
                      <ClassCard
                        key={cls.id}
                        cls={cls}
                        badge={
                          <span className="rounded-full bg-white/30 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white uppercase backdrop-blur-sm">
                            Learner
                          </span>
                        }
                        onClick={() => setSelectedJoined(cls)}
                      />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>

      {/* ── Educator detail overlay ── */}
      {selectedOwned && (
        <EducatorClassOverlay
          cls={selectedOwned}
          onClose={() => setSelectedOwned(null)}
          onUpdate={(updated) =>
            updateOwnedClasses((p) =>
              p.map((c) => (c.id === updated.id ? updated : c))
            )
          }
          onDelete={(id) => {
            updateOwnedClasses((p) => p.filter((c) => c.id !== id));
          }}
        />
      )}

      {/* ── Learner detail overlay ── */}
      {selectedJoined && (
        <LearnerClassOverlay
          cls={selectedJoined}
          onClose={() => setSelectedJoined(null)}
        />
      )}

      {/* ── Create class overlay ── */}
      {showCreate && (
        <Overlay
          onClose={() => {
            setShowCreate(false);
            setCreateError('');
          }}
        >
          <OverlayHeader
            title="New Class"
            gradient="from-blue-500 to-blue-600"
            onClose={() => {
              setShowCreate(false);
              setCreateError('');
            }}
          />
          <div className="flex flex-col gap-3 p-5">
            <LabeledInput
              label="Class Name"
              placeholder="e.g. Mathematics 101"
              value={newName}
              onChange={setNewName}
              disabled={creating}
            />
            {createError && (
              <ErrorBanner
                message={createError}
                onDismiss={() => setCreateError('')}
              />
            )}
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40"
            >
              {creating && <Spinner />} Create Class
            </button>
          </div>
        </Overlay>
      )}

      {/* ── Join class overlay ── */}
      {showJoin && (
        <Overlay
          onClose={() => {
            setShowJoin(false);
            setJoinStatus('idle');
          }}
        >
          <OverlayHeader
            title="Join a Class"
            gradient="from-orange-500 to-orange-600"
            onClose={() => {
              setShowJoin(false);
              setJoinStatus('idle');
            }}
          />
          <div className="flex flex-col gap-3 p-5">
            <LabeledInput
              label="Classroom ID"
              placeholder="Paste the classroom ID from your educator"
              value={joinId}
              onChange={(v) => {
                setJoinId(v);
                setJoinStatus('idle');
                setJoinError('');
              }}
              disabled={joining || joinStatus === 'success'}
            />
            {joinStatus === 'error' && (
              <ErrorBanner
                message={joinError || 'Invalid ID. Check with your educator.'}
                onDismiss={() => {
                  setJoinStatus('idle');
                  setJoinError('');
                }}
              />
            )}
            {joinStatus === 'success' && (
              <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-600 ring-1 ring-emerald-100">
                🎉 Joined successfully!
              </p>
            )}
            <button
              onClick={handleJoin}
              disabled={!joinId.trim() || joining || joinStatus === 'success'}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl bg-orange-600 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-40"
            >
              {joining && <Spinner />} Join Class
            </button>
          </div>
        </Overlay>
      )}
    </div>
  );
}
