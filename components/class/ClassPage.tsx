'use client';

import React, { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'Learner' | 'Educator';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Classroom {
  id: string;
  name: string;
  owner: User | string;
  members: User[];
}

// ─── Palette for class cards ──────────────────────────────────────────────────

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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_EDUCATOR_CLASSES: Classroom[] = [
  {
    id: '1',
    name: 'Mathematics 101',
    owner: 'You',
    members: [
      { id: 'u1', name: 'Andi Pratama', email: 'andi@example.com' },
      { id: 'u2', name: 'Budi Santoso', email: 'budi@example.com' },
      { id: 'u3', name: 'Citra Dewi', email: 'citra@example.com' },
    ],
  },
  {
    id: '2',
    name: 'Science Basics',
    owner: 'You',
    members: [
      { id: 'u4', name: 'Dian Rahayu', email: 'dian@example.com' },
      { id: 'u5', name: 'Eko Wijaya', email: 'eko@example.com' },
    ],
  },
  {
    id: '3',
    name: 'English Writing',
    owner: 'You',
    members: [],
  },
];

const MOCK_LEARNER_CLASSES: Classroom[] = [
  {
    id: '4',
    name: 'History & Culture',
    owner: 'Mr. Budi Hartono',
    members: [
      { id: 'u6', name: 'Fajar Nugraha', email: 'fajar@example.com' },
      { id: 'u7', name: 'Gita Lestari', email: 'gita@example.com' },
      { id: 'u8', name: 'Hendra Kusuma', email: 'hendra@example.com' },
      { id: 'u9', name: 'Indah Permata', email: 'indah@example.com' },
      { id: 'u10', name: 'Joko Widodo', email: 'joko@example.com' },
    ],
  },
  {
    id: '5',
    name: 'Biology 101',
    owner: 'Ms. Sari Dewi',
    members: [
      { id: 'u11', name: 'Kartini Sari', email: 'kartini@example.com' },
      { id: 'u12', name: 'Luhut Pandjaitan', email: 'luhut@example.com' },
    ],
  },
];

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

// ─── Class Card ───────────────────────────────────────────────────────────────

function ClassCard({ cls, onClick }: { cls: Classroom; onClick: () => void }) {
  const grad = cardGradient(cls.id);
  return (
    <button
      onClick={onClick}
      className="group font-body flex w-full flex-col overflow-hidden rounded-2xl bg-white text-left shadow-md ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      {/* Coloured banner */}
      <div
        className={`relative h-28 w-full bg-linear-to-br ${grad} flex items-end p-3`}
      >
        {/* learner count */}
        <span className="ml-auto rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white backdrop-blur-sm">
          {cls.members.length}{' '}
          {cls.members.length === 1 ? 'learner' : 'learners'}
        </span>
      </div>

      {/* Card body */}
      <div className="flex flex-col gap-1 p-4">
        <p className="truncate text-sm font-bold text-slate-800 transition group-hover:text-blue-700">
          {cls.name}
        </p>
        <p className="truncate text-xs text-slate-500">
          {typeof cls.owner === 'string' ? cls.owner : cls.owner.name}
        </p>
      </div>
    </button>
  );
}

// ─── Overlay Modal ────────────────────────────────────────────────────────────

function Overlay({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="font-body fixed inset-0 z-50 flex items-center justify-center p-4">
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
      <label className="text-xs font-semibold text-slate-500">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 focus:outline-none"
      />
    </div>
  );
}

// ─── Educator View ────────────────────────────────────────────────────────────

function EducatorView() {
  const [classes, setClasses] = useState<Classroom[]>(MOCK_EDUCATOR_CLASSES);
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddLearner, setShowAddLearner] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newLearnerName, setNewLearnerName] = useState('');
  const [newLearnerEmail, setNewLearnerEmail] = useState('');

  function handleCreateClass() {
    if (!newClassName.trim()) return;
    const c: Classroom = {
      id: Date.now().toString(),
      name: newClassName.trim(),
      owner: 'You',
      members: [],
    };
    setClasses((p) => [...p, c]);
    setNewClassName('');
    setShowCreateModal(false);
  }

  function handleDeleteClass(id: string) {
    setClasses((p) => p.filter((c) => c.id !== id));
    setSelectedClass(null);
  }

  function handleAddLearner() {
    if (!selectedClass || !newLearnerName.trim() || !newLearnerEmail.trim())
      return;
    const m: User = {
      id: Date.now().toString(),
      name: newLearnerName.trim(),
      email: newLearnerEmail.trim(),
    };
    const updated = classes.map((c) =>
      c.id === selectedClass.id ? { ...c, members: [...c.members, m] } : c
    );
    setClasses(updated);
    setSelectedClass(updated.find((c) => c.id === selectedClass.id) ?? null);
    setNewLearnerName('');
    setNewLearnerEmail('');
    setShowAddLearner(false);
  }

  function handleRemoveLearner(memberId: string) {
    if (!selectedClass) return;
    const updated = classes.map((c) =>
      c.id === selectedClass.id
        ? { ...c, members: c.members.filter((m) => m.id !== memberId) }
        : c
    );
    setClasses(updated);
    setSelectedClass(updated.find((c) => c.id === selectedClass.id) ?? null);
  }

  const grad = selectedClass ? cardGradient(selectedClass.id) : '';

  return (
    <>
      {/* Header */}
      <div className="font-body mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-blue-500 uppercase">
            Educator
          </p>
          <h2 className="text-lg font-bold text-slate-800">My Classes</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
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
      </div>

      {/* Grid */}
      {classes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <svg
              className="h-7 w-7 text-slate-400"
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
          </div>
          <p className="text-sm font-medium text-slate-600">No classes yet</p>
          <p className="text-xs text-slate-400">
            Create your first class to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {classes.map((cls) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              onClick={() => setSelectedClass(cls)}
            />
          ))}
        </div>
      )}

      {/* ── Class detail overlay ── */}
      {selectedClass && (
        <Overlay
          onClose={() => {
            setSelectedClass(null);
            setShowAddLearner(false);
          }}
        >
          <OverlayHeader
            title={selectedClass.name}
            gradient={grad}
            onClose={() => {
              setSelectedClass(null);
              setShowAddLearner(false);
            }}
          />

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
            {/* Actions row */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddLearner((v) => !v)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
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
              <button
                onClick={() => handleDeleteClass(selectedClass.id)}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100 active:scale-95"
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
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Delete Class
              </button>
            </div>

            {/* Add learner form */}
            {showAddLearner && (
              <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-black/5">
                <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                  New Learner
                </p>
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
                <div className="flex gap-2">
                  <button
                    onClick={handleAddLearner}
                    disabled={!newLearnerName.trim() || !newLearnerEmail.trim()}
                    className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
                  >
                    Add to Class
                  </button>
                  <button
                    onClick={() => setShowAddLearner(false)}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Learner list */}
            <div>
              <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                Learners · {selectedClass.members.length}
              </p>
              {selectedClass.members.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center">
                  <p className="text-sm text-slate-400">
                    No learners yet. Add one above.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {selectedClass.members.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-black/5"
                    >
                      <Avatar name={m.name} size="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {m.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {m.email}
                        </p>
                      </div>
                      <button
                        onClick={() => handleRemoveLearner(m.id)}
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                        title="Remove"
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
            </div>
          </div>
        </Overlay>
      )}

      {/* ── Create class overlay ── */}
      {showCreateModal && (
        <Overlay onClose={() => setShowCreateModal(false)}>
          <OverlayHeader
            title="New Class"
            gradient="from-blue-500 to-blue-600"
            onClose={() => setShowCreateModal(false)}
          />
          <div className="flex flex-col gap-3 p-5">
            <LabeledInput
              label="Class Name"
              placeholder="e.g. Mathematics 101"
              value={newClassName}
              onChange={setNewClassName}
            />
            <button
              onClick={handleCreateClass}
              disabled={!newClassName.trim()}
              className="mt-1 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40"
            >
              Create Class
            </button>
          </div>
        </Overlay>
      )}
    </>
  );
}

// ─── Learner View ─────────────────────────────────────────────────────────────

function LearnerView() {
  const [classes, setClasses] = useState<Classroom[]>(MOCK_LEARNER_CLASSES);
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinFeedback, setJoinFeedback] = useState<
    'idle' | 'success' | 'error'
  >('idle');

  function handleJoin() {
    if (!joinCode.trim()) return;
    if (joinCode.trim().toUpperCase() === 'MATH202') {
      const newClass: Classroom = {
        id: Date.now().toString(),
        name: 'Mathematics 202',
        owner: 'Mr. Agus Setiawan',
        members: [
          { id: 'u20', name: 'Kartini Sari', email: 'kartini@example.com' },
          { id: 'u21', name: 'Luhut Pandjaitan', email: 'luhut@example.com' },
          { id: 'u22', name: 'Maya Anggraeni', email: 'maya@example.com' },
        ],
      };
      setClasses((p) => [...p, newClass]);
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

  const grad = selectedClass ? cardGradient(selectedClass.id) : '';

  return (
    <>
      {/* Header */}
      <div className="font-body mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest text-blue-500 uppercase">
            Learner
          </p>
          <h2 className="text-lg font-bold text-slate-800">My Classes</h2>
        </div>
        <button
          onClick={() => {
            setShowJoinModal(true);
            setJoinFeedback('idle');
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
              d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
            />
          </svg>
          Join Class
        </button>
      </div>

      {/* Grid */}
      {classes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
            <svg
              className="h-7 w-7 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0118 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-600">No classes yet</p>
          <p className="text-xs text-slate-400">
            Join a class using an invite code from your educator.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {classes.map((cls) => (
            <ClassCard
              key={cls.id}
              cls={cls}
              onClick={() => setSelectedClass(cls)}
            />
          ))}
        </div>
      )}

      {/* Join hint
      <p className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
        Try joining with code <span className="font-mono font-semibold text-blue-600">MATH202</span>
      </p> */}

      {/* ── Class detail overlay ── */}
      {selectedClass && (
        <Overlay onClose={() => setSelectedClass(null)}>
          <OverlayHeader
            title={selectedClass.name}
            gradient={grad}
            onClose={() => setSelectedClass(null)}
          />

          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
            {/* Owner */}
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
                  {typeof selectedClass.owner === 'string'
                    ? selectedClass.owner
                    : selectedClass.owner.name}
                </p>
              </div>
            </div>

            {/* Classmates */}
            <div>
              <p className="mb-2 text-xs font-bold tracking-widest text-slate-400 uppercase">
                Classmates · {selectedClass.members.length}
              </p>
              {selectedClass.members.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center">
                  <p className="text-sm text-slate-400">No classmates yet.</p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {selectedClass.members.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-black/5"
                    >
                      <Avatar name={m.name} size="lg" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-800">
                          {m.name}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {m.email}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Overlay>
      )}

      {/* ── Join overlay ── */}
      {showJoinModal && (
        <Overlay onClose={() => setShowJoinModal(false)}>
          <OverlayHeader
            title="Join a Class"
            gradient="from-blue-500 to-blue-600"
            onClose={() => setShowJoinModal(false)}
          />
          <div className="flex flex-col gap-3 p-5">
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
              <p className="rounded-xl bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600 ring-1 ring-red-100">
                Invalid code. Please check with your educator.
              </p>
            )}
            {joinFeedback === 'success' && (
              <p className="rounded-xl bg-emerald-50 px-3 py-2.5 text-xs font-medium text-emerald-600 ring-1 ring-emerald-100">
                🎉 Joined successfully!
              </p>
            )}
            <button
              onClick={handleJoin}
              disabled={!joinCode.trim() || joinFeedback === 'success'}
              className="mt-1 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-40"
            >
              Join Class
            </button>
          </div>
        </Overlay>
      )}
    </>
  );
}

// ─── Role Toggle ──────────────────────────────────────────────────────────────

function RoleToggle({
  role,
  onChange,
}: {
  role: Role;
  onChange: (r: Role) => void;
}) {
  return (
    <div className="mb-5 flex items-center justify-center">
      <div className="flex items-center gap-1 rounded-xl border border-black/8 bg-slate-100 p-1">
        {(['Learner', 'Educator'] as Role[]).map((r) => (
          <button
            key={r}
            onClick={() => onChange(r)}
            className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition ${
              role === r
                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5'
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
  const [role, setRole] = useState<Role>('Educator');

  return (
    <div className="flex w-full items-start justify-center p-6">
      <div className="w-full max-w-7xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/5">
        <div className="p-8">
          {/* Role toggle — remove in production, read from session */}
          <RoleToggle role={role} onChange={setRole} />
          {role === 'Educator' ? <EducatorView /> : <LearnerView />}
        </div>
      </div>
    </div>
  );
}
