'use client';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '../ui/field';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import {
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  Crop,
  X,
  ImageIcon,
  NotebookPen,
  Sparkles,
} from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import DraftPopup, { QuizDraft } from '@/components/createpages/draftpopup';
import NextImage from 'next/image';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { useRouter } from 'next/navigation';
import { Spinner } from '../ui/spinner';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';

// Maps to schema's 'SingleSelect' | 'MultiSelect'
type QuestionType = 'multiple-choice' | 'multiple-select-choice';

type Question = {
  order: number; // used as the stable local key; DB assigns the real id
  dbId?: string; // optional database ID, assigned after saving
  type: QuestionType;
  time?: number; // in seconds, optional
  question: string;
  answer?: string[]; // the display text for each option (min 2, max 4)
  correctAnswers: number[]; // indices into `answer` — matches schema's correctAnswers: number[]
  imageUrl?: string | null;
  rawImageUrl?: string | null; // for handling uncropped images before saving
  imageRemoved?: boolean; // flag to indicate if the existing image was removed
};

type validationErrors = {
  title?: string;
  description?: string;
  category?: string;
  questions?: Record<
    number, // keyed by question.order
    {
      question?: string;
      answer?: string;
      correctAnswers?: string;
    }
  >;
  questionsError?: string; // for form-level question errors (e.g. no questions added)
};

function validateForm(
  title: string,
  category: string,
  questions: Question[]
): validationErrors {
  const validationErrors: validationErrors = {};

  if (!title.trim()) validationErrors.title = 'Quiz title is required';

  if (!category) validationErrors.category = 'Please select a category';

  if (questions.length < 2) {
    validationErrors.questionsError = 'Please create at least two question';
  }
  const qvalidationErrors: validationErrors['questions'] = {};

  questions.forEach((q) => {
    const e: { question?: string; answer?: string; correctAnswers?: string } =
      {};

    if (!q.question.trim()) e.question = 'Question prompt is required';

    const filled = (q.answer ?? []).filter((a) => a.trim());
    if (filled.length < 2) e.answer = 'At least 2 answer options are required';

    if (q.type === 'multiple-choice') {
      // SingleSelect: exactly one correct answer index
      if (q.correctAnswers.length !== 1)
        e.correctAnswers = 'Select exactly one correct answer';
    }

    if (q.type === 'multiple-select-choice') {
      // MultiSelect: at least one correct answer index
      if (q.correctAnswers.length === 0)
        e.correctAnswers = 'Select at least one correct answer';
    }

    if (Object.keys(e).length > 0) qvalidationErrors[q.order] = e;
  });

  if (Object.keys(qvalidationErrors).length)
    validationErrors.questions = qvalidationErrors;
  return validationErrors;
}

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);
  ctx.drawImage(image, 0, 0);

  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    return null;
  }

  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise<string | null>((resolve) => {
    resolve(croppedCanvas.toDataURL('image/jpeg', 0.85));
  });
}

function getRadianAngle(degreeValue: number) {
  return (degreeValue * Math.PI) / 180;
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

function createImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', reject);
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });
}

function CropModal({
  rawUrl,
  aspect = 4 / 3,
  onSave,
  onCancel,
}: {
  rawUrl: string;
  aspect?: number;
  onSave: (croppedUrl: string) => void;
  onCancel: () => void;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!croppedAreaPixels) return;
    setSaving(true);
    const result = await getCroppedImg(rawUrl, croppedAreaPixels, rotation);
    setSaving(false);
    if (result) onSave(result);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      {/* Blurred backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div className="relative z-10 flex w-full max-w-lg flex-col gap-4 rounded-2xl bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500 text-white">
              <Crop className="h-4 w-4" />
            </div>
            <div>
              <p className="font-body text-sm font-bold text-gray-900">
                Adjust cover image
              </p>
              <p className="font-body text-xs text-gray-500">
                Drag to reposition · scroll to zoom
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cancel crop"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative h-64 w-full overflow-hidden rounded-xl bg-gray-100">
          <Cropper
            image={rawUrl}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <span className="font-body w-10 text-xs text-gray-500">Zoom</span>
          <input
            aria-label="Zoom level"
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-blue-500"
          />
          <span className="font-body w-8 text-right text-xs text-gray-400">
            {zoom.toFixed(1)}×
          </span>
        </div>

        {/* Rotation slider */}
        <div className="flex items-center gap-3">
          <span className="font-body w-10 text-xs text-gray-500">Rotate</span>
          <input
            aria-label="Rotation angle"
            type="range"
            min={-180}
            max={180}
            step={1}
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="flex-1 accent-blue-500"
          />
          <span className="font-body w-8 text-right text-xs text-gray-400">
            {rotation}°
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            className="font-body flex-1 bg-blue-500 font-bold hover:bg-blue-700"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save crop'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="font-body font-bold"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

function ImageUploader({
  value,
  rawValue,
  onChange,
  aspect,
  label,
  optional,
}: {
  value: string | null;
  rawValue?: string | null;
  onChange: (url: string | null, rawUrl?: string | null) => void;
  aspect?: number;
  label?: string;
  optional?: boolean;
}) {
  const [isCropOpen, setIsCropOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const rawUrl = rawValue ?? value;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      onChange(null, dataUrl);
      setIsCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropSave = (croppedUrl: string) => {
    onChange(croppedUrl, rawUrl);
    setIsCropOpen(false);
  };

  const handleCropCancel = () => {
    setIsCropOpen(false);
    if (!value) onChange(null, null);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null, null);
  };

  return (
    <>
      <div className="relative h-36 w-full">
        {/* Upload / preview zone */}
        <div
          className="group relative flex h-full w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed bg-white/60 transition-colors hover:bg-white/80"
          onClick={() => {
            if (!isCropOpen) fileInputRef.current?.click();
          }}
        >
          {value ? (
            <NextImage
              src={value}
              alt={label ?? 'Image preview'}
              width={600}
              height={144}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-sm text-gray-400">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-white">
                <Plus className="h-4 w-4" />
              </div>
              <span className="font-body">{label ?? 'Add image'}</span>
              {optional && (
                <span className="font-body rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
                  optional
                </span>
              )}
            </div>
          )}
        </div>

        {/* Overlay buttons when image is present */}
        {value && (
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsCropOpen(true);
              }}
              className="font-body flex h-7 items-center gap-1 rounded-md bg-black/50 px-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            >
              <Crop className="h-3 w-3" /> Adjust
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="font-body flex h-7 items-center gap-1 rounded-md bg-black/50 px-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            >
              <ImageIcon className="h-3 w-3" /> Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="font-body flex h-7 items-center gap-1 rounded-md bg-black/50 px-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-orange-500/80"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          </div>
        )}

        <input
          aria-label="image upload"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* CropModal is portaled via fixed positioning — always safe outside label */}
      {isCropOpen && rawUrl && (
        <CropModal
          rawUrl={rawUrl}
          aspect={aspect ?? 4 / 3}
          onSave={handleCropSave}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}

function QuestionEditor({
  index,
  question,
  validationErrors,
  onChange,
  onRemove,
}: {
  index: number;
  question: Question;
  validationErrors?: {
    question?: string;
    answer?: string;
    correctAnswers?: string;
  };
  onChange: (patch: Partial<Question>) => void;
  onRemove: () => void;
}) {
  return (
    <Field className="relative rounded-lg border bg-white/50 p-4">
      {/* Remove button */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 max-w-8 text-orange-500"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <FieldLabel className="font-body font-bold">
        Question {index + 1}
      </FieldLabel>
      <span className="font-body text-muted-foreground text-xs leading-none">
        note: You can create true or false question by: <br />
        selecting &quot;Single Answer&quot; and providing &quot;True&quot; and
        &quot;False&quot; as options
      </span>

      {/* Question type selector */}
      <Select
        value={question.type}
        onValueChange={(v) =>
          onChange({
            type: v as QuestionType,
            answer: ['', '', '', ''],
            correctAnswers: [],
          })
        }
      >
        <SelectTrigger className="font-body">
          <SelectValue placeholder="Select a question type" />
        </SelectTrigger>
        <SelectContent className="font-body">
          <SelectItem value="multiple-choice">Single Answer</SelectItem>
          <SelectItem value="multiple-select-choice">
            Multiple Answer
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Add a time limit each question */}
      <Field>
        <FieldLabel className="font-body flex items-center gap-2 font-bold">
          Time Limit (seconds)
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-400">
            optional
          </span>
        </FieldLabel>
        <Input
          type="number"
          max={60}
          placeholder="30"
          value={question.time ?? ''}
          onChange={(e) => {
            const v = e.target.value;
            onChange({ time: v === '' ? undefined : Number(v) });
          }}
          onBlur={(e) => {
            const v = e.target.value;
            if (v === '') {
              onChange({ time: 30 });
              return;
            }
            const n = Math.min(60, Math.max(1, Number(v)));
            onChange({ time: n });
          }}
          className="font-body max-w-15"
        />
      </Field>

      {/* Optional question image — fully self-contained */}
      <Field>
        <FieldLabel className="font-body flex items-center gap-2 font-bold">
          Question Image
          <span className="font-body rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-400">
            optional
          </span>
        </FieldLabel>
        <ImageUploader
          value={question.imageUrl ?? null}
          rawValue={question.rawImageUrl ?? null}
          onChange={(url, rawUrl) =>
            onChange({
              imageUrl: url,
              rawImageUrl: rawUrl,
              imageRemoved: url === null && rawUrl === null,
            })
          }
          aspect={16 / 9} // wider ratio suits question images
          label="Add question image"
          optional
        />
      </Field>

      {/* Question text */}
      <Field>
        <Input
          placeholder="Enter question"
          value={question.question}
          onChange={(e) => onChange({ question: e.target.value })}
          className={
            validationErrors?.question
              ? 'font-body border-orange-400'
              : 'font-body'
          }
        />
        {validationErrors?.question && (
          <p className="font-body mt-1 text-xs text-orange-500">
            {validationErrors.question}
          </p>
        )}
      </Field>

      {/* Multiple choice — SingleSelect: one correct index */}
      {question.type === 'multiple-choice' && (
        <FieldGroup className="mt-3 space-y-2">
          <Field>
            {question.answer?.map((ans, i) => (
              <Input
                key={i}
                placeholder={`Option ${i + 1}`}
                value={ans}
                onChange={(e) => {
                  const newAnswers = [...(question.answer ?? [])];
                  newAnswers[i] = e.target.value;
                  onChange({ answer: newAnswers });
                }}
                className="font-body"
              />
            ))}
            {validationErrors?.answer && (
              <p className="font-body mt-1 text-xs text-orange-500">
                {validationErrors.answer}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel className="font-body font-bold">
              Correct Answer
            </FieldLabel>
            <Select
              value={
                question.correctAnswers.length === 1
                  ? String(question.correctAnswers[0])
                  : ''
              }
              onValueChange={(value) =>
                onChange({ correctAnswers: [Number(value)] })
              }
            >
              <SelectTrigger
                className={
                  validationErrors?.correctAnswers
                    ? 'font-body border-orange-400'
                    : 'font-body'
                }
              >
                <SelectValue placeholder="Select correct answer" />
              </SelectTrigger>
              <SelectContent>
                {question.answer?.map((ans, i) => (
                  <SelectItem key={i} value={String(i)}>
                    {ans || `Answer ${i + 1}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {validationErrors?.correctAnswers && (
              <p className="font-body mt-1 text-xs text-orange-500">
                {validationErrors.correctAnswers}
              </p>
            )}
          </Field>
        </FieldGroup>
      )}

      {/* Multiple select choice — MultiSelect: one or more correct indices */}
      {question.type === 'multiple-select-choice' && (
        <FieldGroup>
          <Field>
            {question.answer?.map((ans, i) => (
              <Input
                key={i}
                placeholder={`Option ${i + 1}`}
                value={ans}
                onChange={(e) => {
                  const newAnswers = [...(question.answer ?? [])];
                  newAnswers[i] = e.target.value;
                  onChange({ answer: newAnswers });
                }}
                className="font-body"
              />
            ))}
            {validationErrors?.answer && (
              <p className="font-body mt-1 text-xs text-orange-500">
                {validationErrors.answer}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel className="font-body font-bold">
              Correct Answers
            </FieldLabel>
            <div className="flex flex-wrap items-center gap-2">
              {question.answer?.map((ans, i) => {
                const selected = question.correctAnswers.includes(i);
                return (
                  <label
                    htmlFor={`correct-answer-${question.order}-${i}`}
                    key={i}
                    className="flex items-center gap-2"
                  >
                    <Checkbox
                      id={`correct-answer-${question.order}-${i}`}
                      checked={selected}
                      onCheckedChange={(checked) => {
                        const next = checked
                          ? [...question.correctAnswers, i]
                          : question.correctAnswers.filter((v) => v !== i);
                        onChange({ correctAnswers: next });
                      }}
                      className="data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500"
                    />
                    <span className="font-body">
                      {ans || `Answer ${i + 1}`}
                    </span>
                  </label>
                );
              })}
            </div>
            {validationErrors?.correctAnswers && (
              <p className="font-body mt-1 text-xs text-orange-500">
                {validationErrors.correctAnswers}
              </p>
            )}
          </Field>
        </FieldGroup>
      )}
    </Field>
  );
}

// ── AI Generate Modal ─────────────────────────────────────────────────────────

type AIGenerateModalProps = {
  title: string;
  description: string;
  onGenerate: (numQuestions: number, difficulty: number) => Promise<void>;
  onClose: () => void;
  isGenerating: boolean;
};

const DIFFICULTY_LABELS = ['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'];

function AIGenerateModal({
  title,
  description,
  onGenerate,
  onClose,
  isGenerating,
}: AIGenerateModalProps) {
  const [numQuestions, setNumQuestions] = useState(3);
  const [difficulty, setDifficulty] = useState(2);

  const canGenerate = title.trim().length >= 5;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(e) =>
        e.target === e.currentTarget && !isGenerating && onClose()
      }
    >
      <div className="flex w-full max-w-sm flex-col gap-5 rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-body text-sm font-semibold text-gray-900">
              Generate Questions with Bos
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="flex h-7 w-7 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-40"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Context preview */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-xs text-blue-700">
          <p className="font-body font-semibold">{title || 'No title yet'}</p>
          {description?.trim() && (
            <p className="mt-0.5 line-clamp-2 text-blue-500">{description}</p>
          )}
          {!canGenerate && (
            <p className="font-body mt-1 font-medium text-orange-500">
              Quiz title must be at least 5 characters to generate.
            </p>
          )}
        </div>

        {/* Number of questions */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="font-body text-sm font-medium text-gray-700">
              Number of questions
            </label>
            <span className="font-body text-sm font-bold text-blue-600">
              {numQuestions}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={6}
            step={1}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>1</span>
            <span>6</span>
          </div>
        </div>

        {/* Difficulty */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="font-body text-sm font-medium text-gray-700">
              Difficulty
            </label>
            <span className="font-body text-sm font-bold text-blue-600">
              {DIFFICULTY_LABELS[difficulty - 1]}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-blue-600"
          />
          <div className="font-body flex justify-between text-xs text-gray-400">
            <span>Very Easy</span>
            <span>Very Hard</span>
          </div>
        </div>

        {/* Warning if questions already exist */}
        <p className="font-body text-center text-xs text-gray-400">
          This will{' '}
          <span className="font-body font-medium text-orange-500">replace</span>{' '}
          any questions you&apos;ve already added.
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="font-body flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onGenerate(numQuestions, difficulty)}
            disabled={!canGenerate || isGenerating}
            className="font-body flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <Spinner className="h-4 w-4" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export type InitialQuizData = {
  quizId: string;
  title: string;
  description: string | null;
  category: string;
  imageUrl?: string | null;
  questions: {
    dbId: string;
    order: number;
    time?: number;
    type: 'SingleSelect' | 'MultiSelect';
    question: string;
    answers: string[];
    correctAnswers: number[];
    imageUrl?: string | null;
  }[];
};

function toLocalType(t: 'SingleSelect' | 'MultiSelect'): QuestionType {
  return t === 'SingleSelect' ? 'multiple-choice' : 'multiple-select-choice';
}

export default function CreateQuizForm({
  initialData,
}: {
  initialData?: InitialQuizData;
}) {
  const isEditMode = initialData !== undefined;

  const [newType, setNewType] = useState<QuestionType>('multiple-choice');
  const padAnswers = (answers: string[] | undefined, size = 4) => {
    const base = answers ?? [];
    return [...base, ...Array(size - base.length).fill('')].slice(0, size);
  };
  const [questions, setQuestions] = useState<Question[]>(
    initialData
      ? initialData.questions.map((q) => ({
          dbId: q.dbId,
          order: q.order,
          type: toLocalType(q.type),
          time: q.time,
          question: q.question,
          answer: padAnswers(q.answers),
          correctAnswers: q.correctAnswers,
          imageUrl: q.imageUrl ?? null,
          rawImageUrl: null,
        }))
      : []
  );

  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(
    initialData?.description ?? ''
  );
  const [category, setCategory] = useState(initialData?.category ?? '');
  const [rawCoverUrl, setRawCoverUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(
    initialData?.imageUrl ?? null
  );
  const [draftOpen, setDraftOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationErrors, setvalidationErrors] = useState<validationErrors>(
    {}
  );
  const categoryMap: Record<string, string> = {
    mathematics: 'Mathematics',
    science: 'Science',
    history: 'History',
    language: 'Language',
    geography: 'Geography',
    technology: 'Technology',
    general: 'General',
  };

  const router = useRouter();
  const addButtonRef = useRef<HTMLButtonElement | null>(null);

  async function blobUrlToFile(url: string, filename: string): Promise<File> {
    const res = await fetch(url);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  }

  const scrollToAddButton = (offset = 120) => {
    const el = addButtonRef.current;
    if (!el) return;

    const top = el.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top - offset, behavior: 'smooth' });
  };

  const initialQuestionCount = useRef(questions.length);

  useEffect(() => {
    if (questions.length > initialQuestionCount.current) {
      scrollToAddButton(120);
    }
  }, [questions.length]);

  const formState = useMemo(
    () => ({
      title,
      description,
      category,
      questions,
      coverUrl,
    }),
    [title, description, category, questions, coverUrl]
  );

  const validationvalidationErrors = useMemo(
    () => (submitted ? validateForm(title, category, questions) : {}),
    [submitted, title, category, questions]
  );

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        order: prev.length,
        type: newType,
        time: 30,
        question: '',
        answer: ['', '', '', ''],
        correctAnswers: [],
      },
    ]);
  };

  const updateQuestion = (order: number, patch: Partial<Question>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.order === order ? { ...q, ...patch } : q))
    );
  };

  const removeQuestion = (order: number) => {
    setQuestions(
      (prev) =>
        prev
          .filter((q) => q.order !== order)
          .map((q, i) => ({ ...q, order: i })) // re-number after removal
    );
  };

  const handleLoadDraft = (draft: QuizDraft) => {
    setCoverUrl(draft.coverUrl ?? null);
    setRawCoverUrl(draft.coverUrl ?? null);
    setTitle(draft.title);
    setDescription(draft.description ?? '');
    setCategory(categoryMap[draft.category?.toLowerCase()] ?? draft.category);
    setQuestions(
      (draft.questions as Question[]).map((q) => ({
        ...q,
        answer: padAnswers(q.answer),
      }))
    );
  };

  const handleAIGenerate = async (numQuestions: number, difficulty: number) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/quiz/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description: description?.trim() || undefined,
          numQuestions,
          difficulty,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Failed to generate questions');
        return;
      }

      // Map AI response → local Question shape
      const generated: Question[] = data.data.map(
        (q: {
          order: number;
          question: string;
          type: 'SingleSelect' | 'MultiSelect';
          time: number;
          answers: string[];
          correctAnswers: number[];
        }) => ({
          order: q.order,
          type: toLocalType(q.type),
          question: q.question,
          time: q.time,
          answer: padAnswers(q.answers),
          correctAnswers: q.correctAnswers,
          imageUrl: null,
          rawImageUrl: null,
        })
      );

      setQuestions(generated);
      setAiModalOpen(false);
      toast.success(`Generated ${generated.length} questions!`);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setSubmitted(true);
    const errs = validateForm(title, category, questions);
    setvalidationErrors(errs);

    const hasvalidationErrors =
      errs.title ||
      errs.category ||
      errs.questionsError ||
      (errs.questions && Object.keys(errs.questions).length > 0);
    if (hasvalidationErrors) {
      console.log(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditMode && initialData) {
        // -- EDIT MODE: handle updates to existing quiz
        // 1. PATCH quiz metadata
        const quizRes = await fetch(`/api/quiz/${initialData.quizId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title,
            description,
            category,
          }),
        });

        if (!quizRes.ok) {
          const d = await quizRes.json().catch(() => ({}));
          toast.error(`${d.message} error: Failed to update quiz details`);
          return;
        }

        // 2. If cover image changed (blob URL means new file), upload it
        if (coverUrl && coverUrl.startsWith('blob:')) {
          const coverFile = await blobUrlToFile(coverUrl, 'cover.jpg');
          const coverForm = new FormData();
          coverForm.append('imageFile', coverFile);
          const coverRes = await fetch(`/api/quiz/${initialData.quizId}`, {
            method: 'PUT',
            credentials: 'include',
            body: coverForm,
          });
          if (!coverRes.ok) {
            const d = await coverRes.json().catch(() => ({}));
            toast.error(`${d.message} error: Failed to update cover image`);
            return;
          }
        }

        // 3. Diff questions
        const currentDbIds = new Set(
          questions.filter((q) => q.dbId).map((q) => q.dbId)
        );

        const originalDbIds = new Set(initialData.questions.map((q) => q.dbId));

        const toDelete = [...originalDbIds].filter(
          (id) => !currentDbIds.has(id)
        );
        const toCreate = questions.filter((q) => !q.dbId);
        const toUpdate = questions.filter((q) => !!q.dbId);

        // DELETE removed questions
        for (const id of toDelete) {
          const res = await fetch(`/api/question/${id}`, {
            method: 'DELETE',
            credentials: 'include',
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            toast.error(
              `${d.message} error: Failed to delete a question. Other changes were saved.`
            );
            return;
          }
        }

        // PATCH modified questions
        for (const q of toUpdate) {
          const res = await fetch(`/api/question/${q.dbId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              question: q.question,
              time: q.time,
              type:
                q.type === 'multiple-choice' ? 'SingleSelect' : 'MultiSelect',
              answers: (q.answer ?? []).filter((a) => a.trim()),
              correctAnswers: q.correctAnswers,
            }),
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            toast.error(
              `${d.message} error: Failed to update a question. Other changes were saved.}`
            );
            return;
          }
        }

        //PUT new question images
        for (const q of toUpdate) {
          if (
            q.dbId &&
            q.imageUrl &&
            (q.imageUrl.startsWith('blob:') || q.imageUrl.startsWith('data:'))
          ) {
            const file = await blobUrlToFile(
              q.imageUrl,
              `question-${q.order}.jpg`
            );
            const qForm = new FormData();
            qForm.append('imageFile', file);

            const imgRes = await fetch(`/api/question/${q.dbId}`, {
              method: 'PUT',
              credentials: 'include',
              body: qForm,
            });

            if (!imgRes.ok) {
              const d = await imgRes.json().catch(() => ({}));
              toast.error(
                `${d.message} error: Failed to update a question image. Other changes were saved.}`
              );
              return;
            }
          }
        }

        for (const q of toUpdate) {
          if (q.dbId && q.imageRemoved) {
            const res = await fetch(`/api/question/${q.dbId}/image`, {
              method: 'DELETE',
              credentials: 'include',
            });

            if (!res.ok) {
              const d = await res.json().catch(() => ({}));
              toast.error(
                `${d.message} error: Failed to remove a question image. Other changes were saved.}`
              );
              return;
            }
          }
        }

        // POST new questions
        const questionFiles = await Promise.all(
          toCreate.map(async (q) => ({
            order: q.order,
            file: q.imageUrl?.startsWith('blob')
              ? await blobUrlToFile(q.imageUrl, `question-${q.order}.jpg`)
              : null,
          }))
        );

        for (const q of toCreate) {
          const qForm = new FormData();
          qForm.append('quiz.id', initialData.quizId);
          qForm.append('question.order', String(q.order));
          qForm.append('question.question', q.question);
          if (q.time !== undefined) {
            qForm.append('question.time', String(q.time));
          }
          qForm.append(
            'question.type',
            q.type === 'multiple-choice' ? 'SingleSelect' : 'MultiSelect'
          );
          q.answer
            ?.filter((a) => a.trim())
            .forEach((ans) => qForm.append('question.answers', ans));
          q.correctAnswers.forEach((idx) =>
            qForm.append('question.correctAnswers', String(idx))
          );
          if (q.imageUrl?.startsWith('blob:')) {
            const file = await blobUrlToFile(
              q.imageUrl,
              `question-${q.order}.jpg`
            );
            qForm.append('question.imageFile', file);
          }

          const res = await fetch(`/api/question`, {
            method: 'POST',
            credentials: 'include',
            body: qForm,
          });
          if (!res.ok) {
            const d = await res.json().catch(() => ({}));
            toast.error(
              `${d.message} error: Failed to add a new question. Other changes were saved.}`
            );
            return;
          }
        }

        toast.success('Quiz updated successfully!', {
          className: 'bg-green-600',
        });
      } else {
        // -- CREATE MODE: create new quiz and questions
        // Convert blob URLs to File objects for multipart upload

        const coverFile = coverUrl
          ? await blobUrlToFile(coverUrl, 'cover.jpg')
          : null;
        const questionFiles = await Promise.all(
          questions.map(async (q) => ({
            order: q.order,
            file: q.imageUrl
              ? await blobUrlToFile(q.imageUrl, `question-${q.order}.jpg`)
              : null,
          }))
        );

        const formData = new FormData();

        // Payload shaped to match CreateQuizAndQuestionsSchema
        const payload = {
          quiz: {
            title,
            description,
            category,
            imageFile: coverFile, // uncomment when blobUrlToFile is wired up
          },
          questions: questions.map((q) => ({
            order: q.order,
            question: q.question,
            time: q.time,
            // Map local types to schema enum values
            type: q.type === 'multiple-choice' ? 'SingleSelect' : 'MultiSelect',
            answers: (q.answer ?? []).filter((a) => a.trim()), // drop blank trailing slots
            correctAnswers: q.correctAnswers, // already number[] indices
            imageFile:
              questionFiles.find((f) => f.order === q.order)?.file ?? undefined,
          })),
        };

        formData.append('quiz.title', payload.quiz.title);
        if (payload.quiz.description?.trim()) {
          formData.append('quiz.description', payload.quiz.description);
        }
        formData.append('quiz.category', payload.quiz.category);
        if (payload.quiz.imageFile) {
          formData.append('quiz.imageFile', payload.quiz.imageFile);
        }

        payload.questions.forEach((q, i) => {
          formData.append(`questions[${i}].order`, String(q.order));
          formData.append(`questions[${i}].question`, q.question);
          if (q.time !== undefined) {
            formData.append(`questions[${i}].time`, String(q.time));
          }
          formData.append(`questions[${i}].type`, q.type);

          q.answers.forEach((ans, aIdx) => {
            formData.append(`questions[${i}].answers[${aIdx}]`, ans);
          });

          q.correctAnswers.forEach((idx, cIdx) => {
            formData.append(
              `questions[${i}].correctAnswers[${cIdx}]`,
              String(idx)
            );
          });

          if (q.imageFile) {
            formData.append(`questions[${i}].imageFile`, q.imageFile);
          }
        });

        const res = await fetch('/api/quiz', {
          method: 'POST',
          body: formData,
          credentials: 'include', // include cookies for auth
        });

        const data = await res.json();
        if (!res.ok) {
          // Handle server-side validation errors or other issues
          toast.error(data.message || 'Failed to create quiz');
        } else {
          toast.success('Quiz created successfully!', {
            className: 'bg-green-600',
          });
          router.push('dashboard/create');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex justify-center">
      <main className="relative mt-4 h-full w-full max-w-2xl items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white bg-linear-to-b from-white to-blue-100 p-10 shadow-sm">
        <div className="absolute inset-0 h-1.5 bg-gradient-to-r from-blue-600 to-orange-400" />{' '}
        {/* color bar */}
        <Button
          variant="ghost"
          className="absolute top-4 left-4 mb-4 flex items-center gap-2 rounded-4xl"
          onClick={() => router.push('/dashboard/create')}
        >
          <ArrowLeft />
        </Button>
        <FieldGroup className="mt-4">
          <FieldTitle>
            <div className="mb-6 flex items-center gap-2">
              <h1 className="font-body text-2xl font-bold text-slate-800">
                Quiz Creation Form
              </h1>
              <div className="rounded-xl bg-blue-600 p-2">
                <NotebookPen className="h-5 w-5 text-white" />
              </div>
            </div>
          </FieldTitle>

          <FieldSet>
            <FieldLegend className="font-body font-bold">
              Quiz Details
            </FieldLegend>
            <FieldDescription className="font-body">
              Information about your quiz
            </FieldDescription>

            {/* Cover image — optional, via reusable ImageUploader */}
            <Field>
              <FieldLabel className="font-body flex items-center gap-2 font-bold">
                Quiz Cover
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-400">
                  optional
                </span>
              </FieldLabel>
              <ImageUploader
                value={coverUrl}
                rawValue={rawCoverUrl}
                onChange={(url, rawUrl) => {
                  setCoverUrl(url);
                  setRawCoverUrl(rawUrl ?? null);
                }}
                aspect={4 / 3}
                label="Add cover image"
                optional
              />
            </Field>

            {/* Title */}
            <Field>
              <FieldLabel className="font-body font-bold">
                Quiz Title
              </FieldLabel>
              <Input
                placeholder="Enter quiz title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={
                  validationErrors.title
                    ? 'font-body border-orange-400'
                    : 'font-body focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                }
              />
              {validationErrors.title && (
                <p className="font-body mt-1 text-xs text-orange-500">
                  {validationErrors.title}
                </p>
              )}
            </Field>

            {/* Description */}
            <Field>
              <FieldLabel className="font-body font-bold">
                Quiz Description
                <span className="font-body rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-400">
                  optional
                </span>
              </FieldLabel>

              <Textarea
                placeholder="Enter quiz description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={
                  validationErrors.description
                    ? 'font-body border-orange-400'
                    : 'font-body'
                }
              />
            </Field>
            {/* Category */}
            <Field>
              <FieldLabel className="font-body font-bold">
                Quiz Category
              </FieldLabel>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  className={
                    validationErrors.category
                      ? 'font-body border-orange-400'
                      : 'font-body'
                  }
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="font-body">
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Science">Science</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                  <SelectItem value="Language">Language</SelectItem>
                  <SelectItem value="Geography">Geography</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.category && (
                <p className="font-body mt-1 text-xs text-orange-500">
                  {validationErrors.category}
                </p>
              )}
            </Field>

            <FieldSeparator />

            {/* Questions */}
            <FieldSet>
              <FieldLegend className="font-body font-bold">
                Questions
              </FieldLegend>
              <FieldDescription className="font-body">
                Add questions for your quiz. Images are optional per question.
              </FieldDescription>

              <FieldGroup>
                {validationErrors.questionsError && (
                  <p className="font-body mt-1 text-xs text-orange-500">
                    {validationErrors.questionsError}
                  </p>
                )}

                {questions.map((q, index) => (
                  <QuestionEditor
                    key={q.order}
                    index={index}
                    question={q}
                    validationErrors={validationErrors.questions?.[q.order]}
                    onChange={(patch) => updateQuestion(q.order, patch)}
                    onRemove={() => removeQuestion(q.order)}
                  />
                ))}

                {/* New question type picker */}
                <Field>
                  <FieldLabel className="font-body font-bold">
                    New Question Type
                  </FieldLabel>
                  <Select
                    value={newType}
                    onValueChange={(v) => setNewType(v as QuestionType)}
                  >
                    <SelectTrigger className="font-body">
                      <SelectValue placeholder="Select a question type" />
                    </SelectTrigger>
                    <SelectContent className="font-body">
                      <SelectItem value="multiple-choice">
                        Single Answer
                      </SelectItem>
                      <SelectItem value="multiple-select-choice">
                        Multiple Answer
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Button
                  className="font-body bg-blue-600 font-bold hover:scale-105 hover:bg-blue-700"
                  ref={addButtonRef}
                  onClick={addQuestion}
                >
                  Add Question <Plus />
                </Button>
                {!isEditMode && (
                  <Button
                    className="font-body border border-blue-600 bg-white font-bold text-blue-600 hover:scale-105 hover:bg-blue-50"
                    onClick={() => setAiModalOpen(true)}
                  >
                    Generate with AI <Sparkles className="h-4 w-4" />
                  </Button>
                )}
                {!isEditMode && (
                  <Button
                    onClick={() => setDraftOpen(true)}
                    className="font-body border border-blue-600 bg-white font-bold text-blue-600 hover:scale-105 hover:bg-blue-50"
                  >
                    Save Draft <Save className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  className="font-body bg-blue-800 font-bold text-white hover:scale-105 hover:bg-blue-900"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="cursor-progress text-blue-300" />
                      Processing...
                    </span>
                  ) : isEditMode ? (
                    'Update Quiz'
                  ) : (
                    'Create Quiz'
                  )}
                </Button>
              </FieldGroup>
            </FieldSet>
          </FieldSet>
        </FieldGroup>
      </main>

      {draftOpen && (
        <DraftPopup
          formState={formState}
          onLoad={handleLoadDraft}
          onClose={() => setDraftOpen(false)}
        />
      )}

      {aiModalOpen && (
        <AIGenerateModal
          title={title}
          description={description ?? ''}
          onGenerate={handleAIGenerate}
          onClose={() => !isGenerating && setAiModalOpen(false)}
          isGenerating={isGenerating}
        />
      )}
    </div>
  );
}
