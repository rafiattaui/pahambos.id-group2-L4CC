'use client';

import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Cropper, { type Area } from 'react-easy-crop';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Tab = 'profile' | 'security' | 'performance';

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

const ChartIcon = () => (
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
    <path d="M3 3v18h18" />
    <path d="M18.7 8.7l-5.2 5.2-2-2L7 16" />
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
          <h3 className="font-body text-sm font-bold text-gray-900">
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
            <span className="font-body text-xs font-bold text-gray-500">
              Zoom
            </span>
            <span className="font-body text-xs font-bold text-gray-400">
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
            <span className="font-body text-xs font-bold text-gray-500">
              Rotation
            </span>
            <span className="font-body text-xs font-bold text-gray-400">
              {rotation}°
            </span>
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
            className="font-body flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-bold text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="font-body flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-400/30 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-60"
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
      <label htmlFor={id} className="font-body text-sm font-bold text-gray-700">
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

// ── performance types ────────────────────────────────────────────────────────
type PerformanceRecord = {
  id: string;
  quizId: string;
  finalScore: number;
  accuracyRate: string;
  longestStreak: number;
  timeTaken: number;
  completedAt: string;
};

type PerformanceResponse = {
  success: boolean;
  message?: string;
  data?: PerformanceRecord[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

function ActivityHeatmap({ data }: { data: PerformanceRecord[] }) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(
    null
  );

  const toLocalDayKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const dayMap = new Map<
    string,
    { count: number; sumAcc: number; sumScore: number }
  >();
  data.forEach((r) => {
    const dayKey = toLocalDayKey(new Date(r.completedAt));
    const accuracy = parseFloat(toPercent(r.accuracyRate));
    const existing = dayMap.get(dayKey);
    if (existing) {
      existing.count += 1;
      existing.sumAcc += accuracy;
      existing.sumScore += r.finalScore;
    } else {
      dayMap.set(dayKey, {
        count: 1,
        sumAcc: accuracy,
        sumScore: r.finalScore,
      });
    }
  });

  const days: {
    dayKey: string;
    count: number;
    avgAccuracy: number;
    totalScore: number;
  }[] = [];
  const today = new Date();
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayKey = toLocalDayKey(d);
    const entry = dayMap.get(dayKey);
    days.push({
      dayKey,
      count: entry?.count ?? 0,
      avgAccuracy: entry ? Math.round(entry.sumAcc / entry.count) : 0,
      totalScore: entry?.sumScore ?? 0,
    });
  }

  function getColor(count: number) {
    if (count === 0) return 'bg-gray-100';
    if (count >= 5) return 'bg-blue-500';
    if (count >= 3) return 'bg-blue-300';
    return 'bg-blue-100';
  }

  const hovered = days.find((d) => d.dayKey === hoveredDay);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="font-body text-sm font-bold text-gray-700">
        Activity (Last 5 Weeks)
      </h3>

      <div className="relative rounded-xl bg-gray-50 p-3 ring-1 ring-gray-100">
        {/* Day-of-week header (x-axis) */}
        <div className="font-body mb-1 grid grid-cols-7 gap-1 px-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div
              key={d}
              className="text-center text-[9px] font-bold text-gray-400"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Grid with week labels (y-axis) */}
        <div className="flex gap-1.5">
          <div className="font-body flex flex-col gap-1.5">
            {['W1', 'W2', 'W3', 'W4', 'W5'].map((w) => (
              <div
                key={w}
                className="flex h-6 w-6 items-center justify-end pr-1 text-[9px] font-bold text-gray-400"
              >
                {w}
              </div>
            ))}
          </div>
          <div className="grid flex-1 grid-cols-7 gap-1.5">
            {days.map((d) => (
              <div
                key={d.dayKey}
                onMouseEnter={(e) => {
                  setHoveredDay(d.dayKey);
                  const rect = e.currentTarget.getBoundingClientRect();
                  const parentRect = e.currentTarget
                    .closest('.relative')!
                    .getBoundingClientRect();
                  setPopupPos({
                    x: rect.left - parentRect.left + rect.width / 2,
                    y: rect.top - parentRect.top,
                  });
                }}
                onMouseLeave={() => setHoveredDay(null)}
                className={`h-6 w-6 cursor-pointer rounded-sm transition-all ${getColor(d.count)} ${
                  hoveredDay === d.dayKey ? 'ring-2 ring-blue-400' : ''
                }`}
              />
            ))}
          </div>
        </div>

        {/* Floating popup */}
        {hovered && popupPos && (
          <div
            className="pointer-events-none absolute z-10 w-44 -translate-x-1/2 -translate-y-full rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-600 shadow-lg"
            style={{
              left: Math.max(88, Math.min(popupPos.x, 999)),
              top: popupPos.y - 8,
            }}
          >
            <p className="font-body font-bold">
              {new Date(hovered.dayKey).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </p>
            {hovered.count > 0 ? (
              <>
                <ul className="font-body list-disc pl-5">
                  <li className="mt-0.5 text-blue-300">
                    {hovered.count} quiz{hovered.count > 1 ? 'zes' : ''} taken
                  </li>
                  <li className="text-blue-300">
                    {hovered.avgAccuracy}% avg accuracy
                  </li>
                  <li className="text-blue-300">
                    {hovered.totalScore} pts earned
                  </li>
                </ul>
              </>
            ) : (
              <p className="mt-0.5 text-blue-300">No quizzes taken</p>
            )}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-blue-500" />
          </div>
        )}

        {/* Legend */}
        <div className="font-body mt-3 flex items-center justify-end gap-2 text-xs text-gray-400">
          <span>Less</span>
          <div className="h-3 w-3 rounded-sm bg-gray-100" />
          <div className="h-3 w-3 rounded-sm bg-blue-100" />
          <div className="h-3 w-3 rounded-sm bg-blue-300" />
          <div className="h-3 w-3 rounded-sm bg-blue-500" />
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

function toPercent(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0%';
  // if value is a decimal (0–1), convert to percent; if already 0–100, leave as-is
  const percent = num <= 1 ? num * 100 : num;
  return `${percent.toFixed(0)}%`;
}

function formatMs(ms: number): string {
  if (!ms || ms <= 0) return '0s';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

// ── performance tab ─────────────────────────────────────────────────────────
function PerformanceTab() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));

  const [tableData, setTableData] = useState<PerformanceRecord[]>([]);
  const [pagination, setPagination] = useState<
    PerformanceResponse['pagination'] | null
  >(null);
  const [chartData, setChartData] = useState<PerformanceRecord[]>([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [loadingChart, setLoadingChart] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch paginated table data — re-runs whenever ?page= changes
  useEffect(() => {
    let cancelled = false;

    async function loadTable() {
      setLoadingTable(true);
      try {
        const res = await fetch(
          `/api/quiz/user/performance?page=${page}&limit=10`
        );
        const json: PerformanceResponse = await res.json();
        if (cancelled) return;
        if (json.success && json.data) {
          setTableData(json.data);
          setPagination(json.pagination ?? null);
        } else {
          setTableData([]);
          setPagination(null);
          setError(json.message ?? null);
        }
      } catch {
        if (!cancelled) setError('Failed to load performance records.');
      } finally {
        if (!cancelled) setLoadingTable(false);
      }
    }

    loadTable();
    return () => {
      cancelled = true;
    };
  }, [page]);

  // Fetch a wider window for the chart — last 50 records, oldest→newest
  // Independent of table pagination; only fetched once on mount
  useEffect(() => {
    let cancelled = false;

    async function loadChart() {
      setLoadingChart(true);
      try {
        const res = await fetch('/api/quiz/user/performance?page=1&limit=50');
        const json: PerformanceResponse = await res.json();
        if (cancelled) return;
        if (json.success && json.data) {
          const sorted = [...json.data].sort(
            (a, b) =>
              new Date(a.completedAt).getTime() -
              new Date(b.completedAt).getTime()
          );
          setChartData(sorted);
        }
      } catch {
        // chart failing silently is acceptable — table error is shown instead
      } finally {
        if (!cancelled) setLoadingChart(false);
      }
    }

    loadChart();
    return () => {
      cancelled = true;
    };
  }, []);

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', 'performance');
    params.set('page', String(p));
    router.push(`${pathname}?${params.toString()}`);
  }

  const toLocalDayKey = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const chartPoints = (() => {
    const grouped = new Map<string, { sum: number; count: number }>();

    chartData.forEach((r) => {
      // Use local date — same logic as ActivityHeatmap's toLocalDayKey
      // to avoid UTC vs local timezone mismatch producing duplicate labels
      const dayKey = toLocalDayKey(new Date(r.completedAt));
      const accuracy = parseFloat(toPercent(r.accuracyRate));

      const existing = grouped.get(dayKey);
      if (existing) {
        existing.sum += accuracy;
        existing.count += 1;
      } else {
        grouped.set(dayKey, { sum: accuracy, count: 1 });
      }
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dayKey, { sum, count }]) => ({
        // Append T12:00:00 so local noon — avoids midnight DST edge cases
        date: new Date(dayKey + 'T12:00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        accuracy: Math.round(sum / count),
        attempts: count,
      }));
  })();

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* ── growth chart ── */}
      <div className="flex flex-col gap-2">
        <h3 className="font-body text-sm font-bold text-gray-700">
          Accuracy Trend
        </h3>
        <div className="h-48 w-full rounded-xl bg-gray-50 p-2 ring-1 ring-gray-100">
          {loadingChart ? (
            <div className="flex h-full items-center justify-center">
              <Spinner />
            </div>
          ) : chartPoints.length === 0 ? (
            <div className="font-body flex h-full items-center justify-center text-sm text-gray-400">
              No quiz history yet
            </div>
          ) : (
            <ResponsiveContainer
              width="100%"
              height="100%"
              className="font-body"
            >
              <LineChart data={chartPoints}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: '12px',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                  }}
                  formatter={(value) => [
                    toPercent(value as number),
                    'Accuracy',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#3b82f6' }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── activity heatmap ── */}
      <ActivityHeatmap data={chartData} />

      {/* ── history table ── */}
      <div className="flex flex-col gap-2">
        <h3 className="font-body text-sm font-bold text-gray-700">
          Quiz History
        </h3>

        {loadingTable ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : error ? (
          <p className="font-body rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-400 ring-1 ring-gray-100">
            {error}
          </p>
        ) : tableData.length === 0 ? (
          <p className="font-body rounded-lg bg-gray-50 px-4 py-6 text-center text-sm text-gray-400 ring-1 ring-gray-100">
            No quiz history yet — go take a quiz!
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl ring-1 ring-gray-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="font-body bg-gray-50 text-left text-xs font-bold text-gray-400">
                  <th className="px-4 py-2.5">Date</th>
                  <th className="px-4 py-2.5 text-right">Score</th>
                  <th className="px-4 py-2.5 text-right">Accuracy</th>
                  <th className="px-4 py-2.5 text-right">Streak</th>
                  <th className="px-4 py-2.5 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tableData.map((r) => (
                  <tr key={r.id} className="text-slate-700">
                    <td className="font-body px-4 py-2.5 text-slate-400">
                      {new Date(r.completedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        timeZone:
                          Intl.DateTimeFormat().resolvedOptions().timeZone,
                      })}
                    </td>
                    <td className="font-body px-4 py-2.5 text-right font-bold">
                      {r.finalScore}
                    </td>
                    <td className="font-body px-4 py-2.5 text-right">
                      {toPercent(r.accuracyRate)}
                    </td>
                    <td className="font-body px-4 py-2.5 text-right">
                      {r.longestStreak}
                    </td>
                    <td className="font-body px-4 py-2.5 text-right text-slate-400">
                      {formatMs(r.timeTaken)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── pagination controls ── */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-2 flex items-center justify-between">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={!pagination.hasPrev}
              className="font-body rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:border-blue-300 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="font-body text-xs font-bold text-gray-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={!pagination.hasNext}
              className="font-body rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-gray-500 transition-colors hover:border-blue-300 hover:text-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// useSearchParams requires a Suspense boundary in Next.js App Router
export default function AccountCard(props: { user: User }) {
  return (
    <Suspense
      fallback={
        <div className="flex w-full max-w-lg items-center justify-center rounded-2xl bg-white p-12 shadow-xl ring-1 shadow-blue-900/10 ring-black/5">
          <Spinner />
        </div>
      }
    >
      <AccountCardInner {...props} />
    </Suspense>
  );
}

// ── main component ───────────────────────────────────────────────────────────
function AccountCardInner({ user }: { user: User }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as Tab | null;
  const tab: Tab =
    tabParam === 'security' || tabParam === 'performance'
      ? tabParam
      : 'profile';

  function setTab(t: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', t);
    // reset page when switching tabs
    if (t !== 'performance') params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  // profile state
  const [username, setUsername] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [editingUsername, setEditingUsername] = useState(false);
  const [draftUsername, setDraftUsername] = useState('');
  const [avatarSrc, setAvatarSrc] = useState<string | null>(
    user.image ?? '/avatar_placeholder.jpg'
  );
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
      setAvatarSrc(user.image ?? '/avatar_placeholder.jpg');
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
        {(['profile', 'security', 'performance'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`font-body relative flex flex-1 items-center justify-center gap-2 py-4 text-sm font-bold transition-colors ${
              tab === t ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'profile' ? (
              <UserIcon />
            ) : t === 'security' ? (
              <LockIcon />
            ) : (
              <ChartIcon />
            )}
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
            <p className="font-body text-xs font-bold text-gray-400">
              JPG, PNG or GIF · max 5 MB
            </p>
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
                className="font-body text-sm font-bold text-gray-700"
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
            className="font-body flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-400/30 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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
      {/* ── performance tab ── */}
      {tab === 'performance' && (
        <div className="flex max-h-[600px] flex-col gap-6 overflow-y-auto p-6 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200">
          <PerformanceTab />
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
