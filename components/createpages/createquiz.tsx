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
} from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import DraftPopup, { QuizDraft } from '@/components/createpages/draftpopup';
import NextImage from 'next/image';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { useRouter } from 'next/navigation';
import { Spinner } from '../ui/spinner';
import { toast } from 'sonner';

// Maps to schema's 'SingleSelect' | 'MultiSelect'
type QuestionType = 'multiple-choice' | 'multiple-select-choice';

type Question = {
  order: number; // used as the stable local key; DB assigns the real id
  dbId?: string; // optional database ID, assigned after saving
  type: QuestionType;
  question: string;
  answer?: string[]; // the display text for each option (min 2, max 4)
  correctAnswers: number[]; // indices into `answer` — matches schema's correctAnswers: number[]
  imageUrl?: string | null;
  rawImageUrl?: string | null; // for handling uncropped images before saving
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
      correctAnswer?: string;
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
    return validationErrors;
  }
  const qvalidationErrors: validationErrors['questions'] = {};

  questions.forEach((q) => {
    const e: { question?: string; answer?: string; correctAnswer?: string } =
      {};

    if (!q.question.trim()) e.question = 'Question prompt is required';

    const filled = (q.answer ?? []).filter((a) => a.trim());
    if (filled.length < 2) e.answer = 'At least 2 answer options are required';

    if (q.type === 'multiple-choice') {
      // SingleSelect: exactly one correct answer index
      if (q.correctAnswers.length !== 1)
        e.correctAnswer = 'Select exactly one correct answer';
    }

    if (q.type === 'multiple-select-choice') {
      // MultiSelect: at least one correct answer index
      if (q.correctAnswers.length === 0)
        e.correctAnswer = 'Select at least one correct answer';
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
              <p className="text-sm font-semibold text-gray-900">
                Adjust cover image
              </p>
              <p className="text-xs text-gray-500">
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
          <span className="w-10 text-xs text-gray-500">Zoom</span>
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
          <span className="w-8 text-right text-xs text-gray-400">
            {zoom.toFixed(1)}×
          </span>
        </div>

        {/* Rotation slider */}
        <div className="flex items-center gap-3">
          <span className="w-10 text-xs text-gray-500">Rotate</span>
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
          <span className="w-8 text-right text-xs text-gray-400">
            {rotation}°
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            className="flex-1 bg-blue-500 hover:bg-blue-700"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save crop'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
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
              <span>{label ?? 'Add image'}</span>
              {optional && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">
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
              className="flex h-7 items-center gap-1 rounded-md bg-black/50 px-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            >
              <Crop className="h-3 w-3" /> Adjust
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="flex h-7 items-center gap-1 rounded-md bg-black/50 px-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            >
              <ImageIcon className="h-3 w-3" /> Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="flex h-7 items-center gap-1 rounded-md bg-black/50 px-2 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-red-500/80"
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
        className="absolute top-2 right-2 max-w-8 text-red-500"
        onClick={onRemove}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <FieldLabel className="font-heading">Question {index + 1}</FieldLabel>

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
        <SelectTrigger>
          <SelectValue placeholder="Select a question type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="multiple-choice">Single Answer</SelectItem>
          <SelectItem value="multiple-select-choice">
            Multiple Answer
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Optional question image — fully self-contained */}
      <Field>
        <FieldLabel className="font-heading flex items-center gap-2">
          Question Image
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-400">
            optional
          </span>
        </FieldLabel>
        <ImageUploader
          value={question.imageUrl ?? null}
          rawValue={question.rawImageUrl ?? null}
          onChange={(url, rawUrl) =>
            onChange({ imageUrl: url, rawImageUrl: rawUrl })
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
          className={validationErrors?.question ? 'border-red-400' : ''}
        />
        {validationErrors?.question && (
          <p className="mt-1 text-xs text-red-500">
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
              />
            ))}
            {validationErrors?.answer && (
              <p className="mt-1 text-xs text-red-500">
                {validationErrors.answer}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel className="font-heading">Correct Answer</FieldLabel>
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
                  validationErrors?.correctAnswers ? 'border-red-400' : ''
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
              <p className="mt-1 text-xs text-red-500">
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
              />
            ))}
            {validationErrors?.answer && (
              <p className="mt-1 text-xs text-red-500">
                {validationErrors.answer}
              </p>
            )}
          </Field>
          <Field>
            <FieldLabel className="font-heading">Correct Answers</FieldLabel>
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
                    <span>{ans || `Answer ${i + 1}`}</span>
                  </label>
                );
              })}
            </div>
            {validationErrors?.correctAnswers && (
              <p className="mt-1 text-xs text-red-500">
                {validationErrors.correctAnswers}
              </p>
            )}
          </Field>
        </FieldGroup>
      )}
    </Field>
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
        order: prev.length + 1,
        type: newType,
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
          .map((q, i) => ({ ...q, order: i + 1 })) // re-number after removal
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

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setSubmitted(true);
    const errs = validateForm(title, category, questions);
    setvalidationErrors(errs);

    const hasvalidationErrors =
      errs.title ||
      errs.category ||
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
          const d = await quizRes.json();
          toast.error(d.message || 'Failed to update quiz');
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
            const d = await coverRes.json();
            toast.error(d.message || 'Failed to update cover image');
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
        const deleteResults = await Promise.allSettled(
          toDelete.map((id) =>
            fetch(`/api/question/${id}`, {
              method: 'DELETE',
              credentials: 'include',
            })
          )
        );

        const deleteFailed = deleteResults.some((r) => r.status === 'rejected');
        if (deleteFailed) toast.error('Some questions could not be deleted');

        // PATCH modified questions
        const patchResults = await Promise.allSettled(
          toUpdate.map(async (q) => {
            const body: Record<string, unknown> = {
              question: q.question,
              type:
                q.type === 'multiple-choice' ? 'SingleSelect' : 'MultiSelect',
              answers: (q.answer ?? []).filter((a) => a.trim()),
              correctAnswers: q.correctAnswers,
            };

            return fetch(`/api/question/${q.dbId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(body),
            });
          })
        );
        const patchFailed = patchResults.some((r) => r.status === 'rejected');
        if (patchFailed) toast.error('Some questions could not be updated');

        // POST new questions
        const questionFiles = await Promise.all(
          toCreate.map(async (q) => ({
            order: q.order,
            file: q.imageUrl?.startsWith('blob')
              ? await blobUrlToFile(q.imageUrl, `question-${q.order}.jpg`)
              : null,
          }))
        );

        const postResults = await Promise.allSettled(
          toCreate.map((q, i) => {
            const qForm = new FormData();
            qForm.append('quiz.id', initialData.quizId);
            qForm.append('question.order', String(q.order));
            qForm.append('question.question', q.question);
            qForm.append(
              'question.type',
              q.type === 'multiple-choice' ? 'SingleSelect' : 'MultiSelect'
            );
            q.answer
              ?.filter((a) => a.trim())
              .forEach((ans) => {
                qForm.append('question.answers', ans);
              });

            q.correctAnswers.forEach((idx) => {
              qForm.append('question.correctAnswers', String(idx));
            });
            const file = questionFiles[i]?.file;
            if (file) qForm.append('question.imageFile', file);
            return fetch(`/api/question`, {
              method: 'POST',
              credentials: 'include',
              body: qForm,
            });
          })
        );
        const postFailed = postResults.some((r) => r.status === 'rejected');
        if (postFailed) toast.error('Some new questions could not be saved');

        if (!deleteFailed && !patchFailed && !postFailed) {
          toast.success('Quiz updated successfully!', {
            className: 'bg-green-600',
          });
        }
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
      <main className="relative mt-4 h-full w-full max-w-2xl items-center justify-center rounded-2xl bg-linear-to-br from-blue-400 from-5% to-white to-30% p-10">
        <Button
          variant="ghost"
          className="absolute top-4 left-4 mb-4 flex items-center gap-2 rounded-4xl"
          onClick={() => router.push('/dashboard/create')}
        >
          <ArrowLeft />
        </Button>

        <FieldGroup className="mt-4">
          <FieldTitle>
            <h1 className="font-heading text-2xl">Quiz Creation Form</h1>
          </FieldTitle>

          <FieldSet>
            <FieldLegend className="font-heading">Quiz Details</FieldLegend>
            <FieldDescription className="font-body">
              Information about your quiz
            </FieldDescription>

            {/* Cover image — optional, via reusable ImageUploader */}
            <Field>
              <FieldLabel className="font-heading flex items-center gap-2">
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
              <FieldLabel className="font-heading">Quiz Title</FieldLabel>
              <Input
                placeholder="Enter quiz title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={validationErrors.title ? 'border-red-400' : ''}
              />
              {validationErrors.title && (
                <p className="mt-1 text-xs text-red-500">
                  {validationErrors.title}
                </p>
              )}
            </Field>

            {/* Description */}
            <Field>
              <FieldLabel className="font-heading">
                Quiz Description
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-normal text-gray-400">
                  optional
                </span>
              </FieldLabel>

              <Input
                placeholder="Enter quiz description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={validationErrors.description ? 'border-red-400' : ''}
              />
            </Field>
            {/* Category */}
            <Field>
              <FieldLabel className="font-heading">Quiz Category</FieldLabel>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger
                  className={validationErrors.category ? 'border-red-400' : ''}
                >
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
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
                <p className="mt-1 text-xs text-red-500">
                  {validationErrors.category}
                </p>
              )}
            </Field>

            <FieldSeparator />

            {/* Questions */}
            <FieldSet>
              <FieldLegend className="font-heading">Questions</FieldLegend>
              <FieldDescription className="font-body">
                Add questions for your quiz. Images are optional per question.
              </FieldDescription>

              <FieldGroup>
                {validationErrors.questionsError && (
                  <p className="mt-1 text-xs text-red-500">
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
                  <FieldLabel className="font-heading">
                    New Question Type
                  </FieldLabel>
                  <Select
                    value={newType}
                    onValueChange={(v) => setNewType(v as QuestionType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a question type" />
                    </SelectTrigger>
                    <SelectContent>
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
                  className="bg-blue-500 hover:scale-105 hover:bg-blue-700"
                  ref={addButtonRef}
                  onClick={addQuestion}
                >
                  Add Question <Plus />
                </Button>
                {!isEditMode && (
                  <Button
                    onClick={() => setDraftOpen(true)}
                    className="bg-blue-500 hover:scale-105 hover:bg-blue-700"
                  >
                    Save Draft <Save className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  className="bg-blue-500 hover:scale-105 hover:bg-blue-700"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <Spinner className="text-blue-300" />
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
    </div>
  );
}
