'use client';

import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'Learner' | 'Educator';

interface Member {
  id: string;
  name: string;
  email: string;
  image?: string;
}

interface Classroom {
  id: string;
  name: string;
  members: Member[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_EDUCATOR_CLASSES: Classroom[] = [
  {
    id: '1',
    name: 'Mathematics 101',
    members: [
      { id: 'u1', name: 'Andi Pratama', email: 'andi@example.com' },
      { id: 'u2', name: 'Budi Santoso', email: 'budi@example.com' },
      { id: 'u3', name: 'Citra Dewi', email: 'citra@example.com' },
    ],
  },
  {
    id: '2',
    name: 'Science Basics',
    members: [
      { id: 'u4', name: 'Dian Rahayu', email: 'dian@example.com' },
      { id: 'u5', name: 'Eko Wijaya', email: 'eko@example.com' },
    ],
  },
];

const MOCK_LEARNER_CLASSES: Classroom[] = [
  {
    id: '3',
    name: 'History & Culture',
    members: [],
  },
];

// ─── Shared: Avatar ───────────────────────────────────────────────────────────

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
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
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm';

  return (
    <div
      className={`${sizeClass} ${color} flex shrink-0 items-center justify-center rounded-full font-semibold`}
    >
      {initials}
    </div>
  );
}

// ─── Educator View ────────────────────────────────────────────────────────────

function EducatorView() {
  const [classes, setClasses] = useState<Classroom[]>(MOCK_EDUCATOR_CLASSES);
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddLearnerModal, setShowAddLearnerModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newLearnerEmail, setNewLearnerEmail] = useState('');
  const [newLearnerName, setNewLearnerName] = useState('');

  function handleCreateClass() {
    if (!newClassName.trim()) return;
    const created: Classroom = {
      id: Date.now().toString(),
      name: newClassName.trim(),
      members: [],
    };
    setClasses((prev) => [...prev, created]);
    setNewClassName('');
    setShowCreateModal(false);
  }

  function handleAddLearner() {
    if (!selectedClass || !newLearnerEmail.trim() || !newLearnerName.trim())
      return;
    const newMember: Member = {
      id: Date.now().toString(),
      name: newLearnerName.trim(),
      email: newLearnerEmail.trim(),
    };
    const updated = classes.map((c) =>
      c.id === selectedClass.id
        ? { ...c, members: [...c.members, newMember] }
        : c
    );
    setClasses(updated);
    setSelectedClass(updated.find((c) => c.id === selectedClass.id) ?? null);
    setNewLearnerEmail('');
    setNewLearnerName('');
    setShowAddLearnerModal(false);
  }

  function handleRemoveLearner(memberId: string) {
    if (!selectedClass) return;
    const updated = classes.map((c) =>
      c.id === selectedClass.id
        ? {
            ...c,
            members: c.members.filter((m) => m.id !== memberId),
          }
        : c
    );
    setClasses(updated);
    setSelectedClass(updated.find((c) => c.id === selectedClass.id) ?? null);
  }

  // ── Detail panel ──
  if (selectedClass) {
    return (
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedClass(null)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-black/8 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-widest text-violet-500 uppercase">
              Classroom
            </p>
            <h2 className="truncate text-lg font-bold text-slate-800">
              {selectedClass.name}
            </h2>
          </div>
          <button
            onClick={() => setShowAddLearnerModal(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 active:scale-95"
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
            Add Learner
          </button>
        </div>

        <div className="h-px bg-slate-100" />

        {/* Members list */}
        {selectedClass.members.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
              <svg
                className="h-6 w-6 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 20h5v-2a4 4 0 00-5-4M9 20H4v-2a4 4 0 015-4m6-4a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-600">
              No learners yet
            </p>
            <p className="text-xs text-slate-400">
              Add learners to get this class started.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {selectedClass.members.map((member) => (
              <li
                key={member.id}
                className="flex items-center gap-3 rounded-xl border border-black/5 bg-slate-50 px-4 py-3"
              >
                <Avatar name={member.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {member.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {member.email}
                  </p>
                </div>
                <button
                  onClick={() => handleRemoveLearner(member.id)}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                  title="Remove learner"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add Learner Modal */}
        {showAddLearnerModal && (
          <Modal
            title="Add Learner"
            onClose={() => setShowAddLearnerModal(false)}
          >
            <div className="flex flex-col gap-3">
              <LabeledInput
                label="Full Name"
                placeholder="e.g. Andi Pratama"
                value={newLearnerName}
                onChange={setNewLearnerName}
              />
              <LabeledInput
                label="Email"
                placeholder="e.g. andi@example.com"
                value={newLearnerEmail}
                onChange={setNewLearnerEmail}
                type="email"
              />
              <button
                onClick={handleAddLearner}
                disabled={!newLearnerEmail.trim() || !newLearnerName.trim()}
                className="mt-1 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[0.98] disabled:opacity-40"
              >
                Add to Class
              </button>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ── Class list ──
  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest text-violet-500 uppercase">
            Educator
          </p>
          <h2 className="text-lg font-bold text-slate-800">My Classes</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 active:scale-95"
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
      </div>

      <div className="h-px bg-slate-100" />

      {classes.length === 0 ? (
        <EmptyState
          icon={
            <svg
              className="h-6 w-6 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 10h16M4 14h10"
              />
            </svg>
          }
          title="No classes yet"
          subtitle="Create your first class to get started."
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {classes.map((cls) => (
            <li key={cls.id}>
              <button
                onClick={() => setSelectedClass(cls)}
                className="group flex w-full items-center gap-4 rounded-xl border border-black/5 bg-slate-50 px-4 py-3.5 text-left transition hover:border-violet-200 hover:bg-violet-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                  <svg
                    className="h-5 w-5 text-violet-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-violet-700">
                    {cls.name}
                  </p>
                </div>
                <svg
                  className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-violet-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Modal title="Create Class" onClose={() => setShowCreateModal(false)}>
          <div className="flex flex-col gap-3">
            <LabeledInput
              label="Class Name"
              placeholder="e.g. Mathematics 101"
              value={newClassName}
              onChange={setNewClassName}
            />
            <button
              onClick={handleCreateClass}
              disabled={!newClassName.trim()}
              className="mt-1 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[0.98] disabled:opacity-40"
            >
              Create Class
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Learner View ─────────────────────────────────────────────────────────────

function LearnerView() {
  const [classes, setClasses] = useState<Classroom[]>(MOCK_LEARNER_CLASSES);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinFeedback, setJoinFeedback] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  function handleJoin() {
    if (!joinCode.trim()) return;
    // Simulate join: code "MATH202" adds a new class
    if (joinCode.trim().toUpperCase() === 'MATH202') {
      const newClass: Classroom = {
        id: Date.now().toString(),
        name: 'Mathematics 202',
        members: [],
      };
      setClasses((prev) => [...prev, newClass]);
      setJoinFeedback('success');
      setTimeout(() => {
        setJoinCode('');
        setJoinFeedback('idle');
        setShowJoinModal(false);
      }, 1200);
    } else {
      setJoinFeedback('error');
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest text-violet-500 uppercase">
            Learner
          </p>
          <h2 className="text-lg font-bold text-slate-800">My Classes</h2>
        </div>
        <button
          onClick={() => {
            setShowJoinModal(true);
            setJoinFeedback('idle');
          }}
          className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 active:scale-95"
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
      </div>

      <div className="h-px bg-slate-100" />

      {classes.length === 0 ? (
        <EmptyState
          icon={
            <svg
              className="h-6 w-6 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          }
          title="No classes yet"
          subtitle="Join a class with an invite code from your educator."
        />
      ) : (
        <ul className="flex flex-col gap-2.5">
          {classes.map((cls) => (
            <li key={cls.id}>
              <div className="flex items-center gap-4 rounded-xl border border-black/5 bg-slate-50 px-4 py-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                  <svg
                    className="h-5 w-5 text-violet-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                    />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">
                    {cls.name}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-medium text-violet-700">
                  Enrolled
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Join hint */}
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
        Try joining with code{' '}
        <span className="font-mono font-semibold text-violet-600">MATH202</span>
      </p>

      {/* Join Modal */}
      {showJoinModal && (
        <Modal title="Join a Class" onClose={() => setShowJoinModal(false)}>
          <div className="flex flex-col gap-3">
            <LabeledInput
              label="Invite Code"
              placeholder="e.g. MATH202"
              value={joinCode}
              onChange={(v) => {
                setJoinCode(v);
                setJoinFeedback('idle');
              }}
            />
            {joinFeedback === 'error' && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                Invalid code. Please check with your educator.
              </p>
            )}
            {joinFeedback === 'success' && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600">
                🎉 Joined successfully!
              </p>
            )}
            <button
              onClick={handleJoin}
              disabled={!joinCode.trim() || joinFeedback === 'success'}
              className="mt-1 w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-700 active:scale-[0.98] disabled:opacity-40"
            >
              Join Class
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Shared Sub-components ────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function LabeledInput({
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-slate-600">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-200 focus:outline-none"
      />
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      <p className="max-w-xs text-xs text-slate-400">{subtitle}</p>
    </div>
  );
}

// ─── Role Toggle (demo) ───────────────────────────────────────────────────────

function RoleToggle({
  role,
  onChange,
}: {
  role: Role;
  onChange: (r: Role) => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-center">
      <div className="flex items-center gap-1 rounded-xl border border-black/8 bg-slate-100 p-1">
        {(['Learner', 'Educator'] as Role[]).map((r) => (
          <button
            key={r}
            onClick={() => onChange(r)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
              role === r
                ? 'bg-white text-violet-700 shadow-sm ring-1 ring-black/5'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function ClassroomDetails() {
  // In a real app, `role` comes from your session/auth context.
  // This toggle is for demo purposes only.
  const [role, setRole] = useState<Role>('Educator');

  return (
    <div className="flex min-h-[calc(100vh-80px)] w-full items-center justify-center p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl ring-1 shadow-violet-900/10 ring-black/5">
        <div className="flex flex-col gap-0 p-6">
          {/* Role toggle — remove in production and read from session */}
          <RoleToggle role={role} onChange={setRole} />

          {role === 'Educator' ? <EducatorView /> : <LearnerView />}
        </div>
      </div>
    </div>
  );
}
