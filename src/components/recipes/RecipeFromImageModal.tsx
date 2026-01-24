import React, { useEffect, useRef, useState } from 'react';
import { X, ImageUp, Ban } from 'lucide-react';
import Button from '../ui/Button';
import FileUpload from '../ui/FileUpload';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import { RecipeCreate, RecipeFromImageJob } from '../../types';
import { cancelRecipeParseFromImageJob, getRecipeParseFromImageJob, startRecipeParseFromImage } from '../../api/recipeApi';
import { coerceUnit } from '../../utils/unitUtils';

type ModalStep = 'select' | 'uploading' | 'processing' | 'error';

interface RecipeFromImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseDraft: (draft: Partial<RecipeCreate>, ingredientNotes: string[]) => void;
}

const getErrorMessage = (e: unknown): string => {
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return 'Unknown error';
};

const buildDraftFromJob = (job: RecipeFromImageJob): { recipe: Partial<RecipeCreate>; ingredientNotes: string[] } | null => {
  if (!job.result) return null;
  const result = job.result;
  const ingredientNotes = (result.ingredients || []).map(i => i.matched_ingredient_name || i.raw_name);
  const ingredients = (result.ingredients || []).map(i => ({
    ingredient_id: i.matched_ingredient_id || 0,
    quantity: typeof i.quantity === 'number' ? i.quantity : 1,
    unit: coerceUnit(i.unit, 'piece')
  }));

  const calories = result.nutrition?.calories ?? 0;
  const recipe: Partial<RecipeCreate> = {
    name: result.name || '',
    servings: result.servings ?? 4,
    prep_time: result.prep_time ?? 15,
    cook_time: result.cook_time ?? 30,
    instructions: result.instructions || '',
    category: result.category || 'dinner',
    dietary_tags: [],
    calories: Math.round(calories),
    protein: result.nutrition?.protein ?? 0,
    carbs: result.nutrition?.carbs ?? 0,
    fats: result.nutrition?.fats ?? 0,
    breakfast_weight: 0.2,
    lunch_weight: 0.3,
    dinner_weight: 0.5,
    ingredients
  };
  return { recipe, ingredientNotes };
};

const RecipeFromImageModal: React.FC<RecipeFromImageModalProps> = ({ isOpen, onClose, onUseDraft }) => {
  const [step, setStep] = useState<ModalStep>('select');
  const [job, setJob] = useState<RecipeFromImageJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);
  const attemptRef = useRef(0);
  const didOpenEditorRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setStep('select');
      setJob(null);
      setError(null);
      attemptRef.current = 0;
      didOpenEditorRef.current = false;
      if (pollTimerRef.current !== null) {
        window.clearTimeout(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }
  }, [isOpen]);

  const handleImageSelect = (_url: string, file?: File) => {
    if (!file) return;
    startParse(file);
  };

  const handleImageRemove = () => {
    setError(null);
    setJob(null);
    setStep('select');
    didOpenEditorRef.current = false;
    attemptRef.current = 0;
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const schedulePoll = (jobId: string) => {
    const attempt = attemptRef.current;
    const delayMs = Math.min(4000, 1000 + attempt * 250);
    pollTimerRef.current = window.setTimeout(() => pollJob(jobId), delayMs);
    attemptRef.current += 1;
  };

  const pollJob = async (jobId: string) => {
    try {
      const next = await getRecipeParseFromImageJob(jobId);
      if (!isMountedRef.current) return;
      setJob(next);
      if (next.status === 'completed') {
        if (didOpenEditorRef.current) return;
        const draft = buildDraftFromJob(next);
        if (!draft) {
          setStep('error');
          setError('Parsing completed but no result was returned');
          return;
        }
        didOpenEditorRef.current = true;
        if (pollTimerRef.current !== null) {
          window.clearTimeout(pollTimerRef.current);
          pollTimerRef.current = null;
        }
        onUseDraft(draft.recipe, draft.ingredientNotes);
        return;
      }
      if (next.status === 'failed' || next.status === 'canceled') {
        setStep('error');
        setError(next.error || (next.status === 'canceled' ? 'Canceled' : 'Failed'));
        return;
      }
      schedulePoll(jobId);
    } catch (e: unknown) {
      if (!isMountedRef.current) return;
      setStep('error');
      setError(getErrorMessage(e) || 'Failed to get job status');
    }
  };

  const startParse = async (file: File) => {
    setError(null);
    setJob(null);
    setStep('uploading');
    attemptRef.current = 0;
    didOpenEditorRef.current = false;
    try {
      const started = await startRecipeParseFromImage(file);
      if (!isMountedRef.current) return;
      setStep('processing');
      const initialJob: RecipeFromImageJob = {
        id: started.job_id,
        status: 'queued',
        current_step: '',
        step_progress: 0,
        overall_progress: 0,
        result: null,
        error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setJob(initialJob);
      schedulePoll(started.job_id);
    } catch (e: unknown) {
      if (!isMountedRef.current) return;
      setStep('error');
      setError(getErrorMessage(e) || 'Failed to start parsing');
    }
  };

  const handleCancel = async () => {
    if (!job) return;
    if (pollTimerRef.current !== null) {
      window.clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    try {
      await cancelRecipeParseFromImageJob(job.id);
      if (!isMountedRef.current) return;
      setJob(prev => prev ? { ...prev, status: 'canceled' } : prev);
      setStep('error');
      setError('Canceled');
    } catch (e: unknown) {
      if (!isMountedRef.current) return;
      setError(getErrorMessage(e) || 'Failed to cancel job');
      setStep('processing');
      schedulePoll(job.id);
    }
  };

  if (!isOpen) return null;

  const showProgress = step === 'processing' && job;
  const progressValue = job ? Math.max(0, Math.min(100, job.overall_progress)) : 0;
  const progressLabel = job?.current_step ? job.current_step : (step === 'uploading' ? 'uploading' : '');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <ImageUp className="h-6 w-6 text-primary-600" />
            <h2 className="text-xl font-semibold text-neutral-900">Add Recipe from Image</h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
            disabled={step === 'uploading' || step === 'processing'}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Recipe Image
            </label>
            <FileUpload
              value={undefined}
              onChange={handleImageSelect}
              onRemove={handleImageRemove}
              isUploading={step === 'uploading' || step === 'processing'}
              showPreview={false}
            />
          </div>

          {showProgress && (
            <Card>
              <CardHeader>
                <CardTitle>Parsing Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-neutral-700">
                    <span className="capitalize">{progressLabel.replace(/_/g, ' ')}</span>
                    <span>{progressValue}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-200 rounded">
                    <div
                      className="h-2 bg-primary-600 rounded transition-all"
                      style={{ width: `${progressValue}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      variant="outline"
                      leftIcon={<Ban size={16} />}
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 'error' && error && (
            <div className="rounded-md border border-error-200 bg-error-50 p-4 text-sm text-error-700">
              {error}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={step === 'uploading' || step === 'processing'}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeFromImageModal;
