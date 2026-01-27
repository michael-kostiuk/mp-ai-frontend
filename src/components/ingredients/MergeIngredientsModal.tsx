import React, { useState } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { X, ArrowRight, Trash2, Plus } from 'lucide-react';
import Button from '../ui/Button';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import IngredientSearchSelect from '../recipes/IngredientSearchSelect';
import useApi from '../../hooks/useApi';
import { mergeIngredients } from '../../api/ingredientApi';

interface MergeIngredientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const MergeIngredientsModal: React.FC<MergeIngredientsModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { t } = useTranslation();
  const [keepIngredientId, setKeepIngredientId] = useState<number>(0);
  const [mergeIngredientIds, setMergeIngredientIds] = useState<number[]>([0]);

  const { loading: merging, execute: performMerge } = useApi(mergeIngredients);

  const addMergeIngredient = () => {
    setMergeIngredientIds(prev => [...prev, 0]);
  };

  const removeMergeIngredient = (index: number) => {
    setMergeIngredientIds(prev => prev.filter((_, i) => i !== index));
  };

  const updateMergeIngredient = (index: number, ingredientId: number) => {
    setMergeIngredientIds(prev =>
      prev.map((id, i) => i === index ? ingredientId : id)
    );
  };

  const validateForm = () => {
    if (keepIngredientId === 0) return false;
    if (mergeIngredientIds.length === 0) return false;
    if (mergeIngredientIds.some(id => id === 0)) return false;
    if (mergeIngredientIds.includes(keepIngredientId)) return false;

    // Check for duplicates in merge list
    const uniqueIds = new Set(mergeIngredientIds);
    if (uniqueIds.size !== mergeIngredientIds.length) return false;

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      alert(t('ingredients.merge.validationError'));
      return;
    }

    try {
      await performMerge(keepIngredientId, mergeIngredientIds);
      onSuccess();
      onClose();

      // Reset form
      setKeepIngredientId(0);
      setMergeIngredientIds([0]);
    } catch (error) {
      console.error('Failed to merge ingredients:', error);
      alert(t('ingredients.merge.mergeFailed'));
    }
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setKeepIngredientId(0);
    setMergeIngredientIds([0]);
  };

  const hasConflicts = mergeIngredientIds.includes(keepIngredientId) ||
    new Set(mergeIngredientIds).size !== mergeIngredientIds.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">{t('ingredients.merge.title')}</h2>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-primary-800 mb-2">{t('ingredients.merge.howMergingWorks')}</h3>
            <ul className="text-sm text-primary-700 space-y-1">
              <li>• <Trans i18nKey="ingredients.merge.keepDescription" components={{ strong: <strong /> }} /></li>
              <li>• <Trans i18nKey="ingredients.merge.mergeDescription" components={{ strong: <strong /> }} /></li>
              <li>• {t('ingredients.merge.recipesUpdated')}</li>
              <li>• {t('ingredients.merge.permanentlyDeleted')}</li>
            </ul>
          </div>

          {/* Keep Ingredient */}
          <Card allowOverflow>
            <CardHeader>
              <CardTitle className="text-lg text-success-700">{t('ingredients.merge.ingredientToKeep')}</CardTitle>
            </CardHeader>
            <CardContent>
              <IngredientSearchSelect
                value={keepIngredientId}
                onChange={setKeepIngredientId}
                placeholder={t('ingredients.merge.searchToKeep')}
              />
              <p className="text-sm text-neutral-500 mt-2">
                {t('ingredients.merge.keepWillRemain')}
              </p>
            </CardContent>
          </Card>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="bg-neutral-100 rounded-full p-3">
              <ArrowRight className="h-6 w-6 text-neutral-600" />
            </div>
          </div>

          {/* Merge Ingredients */}
          <Card allowOverflow>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg text-error-700">{t('ingredients.merge.ingredientsToMerge')}</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMergeIngredient}
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  {t('ingredients.addIngredient')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {mergeIngredientIds.map((ingredientId, index) => (
                <div key={index} className="flex items-end space-x-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      {t('ingredients.merge.ingredientNumber', { number: index + 1 })}
                    </label>
                    <IngredientSearchSelect
                      value={ingredientId}
                      onChange={(id) => updateMergeIngredient(index, id)}
                      placeholder={t('ingredients.merge.searchToMerge')}
                    />
                    {ingredientId > 0 && ingredientId === keepIngredientId && (
                      <p className="text-xs text-error-600 mt-1">
                        ⚠️ {t('ingredients.merge.cannotMergeIntoSelf')}
                      </p>
                    )}
                    {ingredientId > 0 && mergeIngredientIds.filter(id => id === ingredientId).length > 1 && (
                      <p className="text-xs text-error-600 mt-1">
                        ⚠️ {t('ingredients.merge.duplicateSelected')}
                      </p>
                    )}
                  </div>

                  {mergeIngredientIds.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeMergeIngredient(index)}
                      className="text-error-600 hover:text-error-700 h-[42px] px-3"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <p className="text-sm text-neutral-500">
                {t('ingredients.merge.willBeDeleted')}
              </p>
            </CardContent>
          </Card>

          {/* Validation Summary */}
          {hasConflicts && (
            <div className="bg-error-50 border border-error-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-error-800 mb-2">⚠️ {t('ingredients.merge.issuesFound')}</h4>
              <ul className="text-sm text-error-700 space-y-1">
                {mergeIngredientIds.includes(keepIngredientId) && (
                  <li>• {t('ingredients.merge.cannotMergeIntoSelf')}</li>
                )}
                {new Set(mergeIngredientIds).size !== mergeIngredientIds.length && (
                  <li>• {t('ingredients.merge.duplicatesInMerge')}</li>
                )}
              </ul>
            </div>
          )}

          {/* Summary */}
          {validateForm() && (
            <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-warning-800 mb-2">⚠️ {t('ingredients.merge.mergeSummary')}</h4>
              <p className="text-sm text-warning-700">
                <Trans
                  i18nKey="ingredients.merge.aboutToMerge"
                  values={{ count: mergeIngredientIds.length }}
                  components={{ strong: <strong /> }}
                />
              </p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-neutral-200">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              isLoading={merging}
              disabled={!validateForm()}
              className="bg-error-600 hover:bg-error-700 focus:ring-error-500"
            >
              {merging ? t('ingredients.merge.merging') : t('ingredients.mergeIngredients')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MergeIngredientsModal;
