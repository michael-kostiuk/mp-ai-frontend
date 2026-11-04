import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusCircle, Calendar, Archive, ChevronDown } from 'lucide-react';
import Container from '../components/layout/Container';
import PageHeader from '../components/layout/PageHeader';
import MealPlanCard from '../components/mealPlans/MealPlanCard';
import CreateMealPlanModal from '../components/mealPlans/CreateMealPlanModal';
import { getLatestPlans, toDateKey } from '../utils/mealPlanUtils';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import ErrorMessage from '../components/ui/ErrorMessage';
import Card, { CardContent } from '../components/ui/Card';
import { MealPlan } from '../types';
import useCachedApi from '../hooks/useCachedApi';
import { getMealPlans } from '../api/mealPlanApi';

const MealPlans: React.FC = () => {
  const { t } = useTranslation();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMealPlan, setEditingMealPlan] = useState<MealPlan | null>(null);
  
  const { data: mealPlans, loading, error, execute: fetchMealPlans } = useCachedApi<MealPlan[], []>('mealPlans', getMealPlans, { initialArgs: [] });
  
  // Load meal plans only once on mount
  useEffect(() => {
    fetchMealPlans();
  }, [fetchMealPlans]);

  const todayKey = toDateKey(new Date());
  const [showArchive, setShowArchive] = useState(false);
  // One card per week (its newest version); finished weeks go to the archive
  const { currentPlans, pastPlans } = useMemo(() => {
    const latest = getLatestPlans(mealPlans ?? []).sort((a, b) => b.plan.end_date.localeCompare(a.plan.end_date));
    return {
      currentPlans: latest.filter(({ plan }) => plan.end_date.slice(0, 10) >= todayKey),
      pastPlans: latest.filter(({ plan }) => plan.end_date.slice(0, 10) < todayKey),
    };
  }, [mealPlans, todayKey]);

  const handleCreateSuccess = () => {
    fetchMealPlans(); // Refresh the list after creating
  };

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingMealPlan(null); // Clear editing meal plan when closing
  };

  return (
    <Container className="py-6 sm:py-8 lg:py-12">
      <PageHeader
        title={t('mealPlans.title')}
        description={t('mealPlans.description')}
        actions={
          <Button 
            leftIcon={<PlusCircle size={18} />}
            onClick={() => {
              setEditingMealPlan(null); // Ensure we're creating, not editing
              setIsCreateModalOpen(true);
            }}
            className="w-full sm:w-auto"
          >
            {t('mealPlans.createMealPlan')}
          </Button>
        }
      />

      {loading && mealPlans === null && (
        <div className="py-12 lg:py-16">
          <Loader centered label={t('mealPlans.loadingMealPlans')} />
        </div>
      )}
      
      {error && (
        <ErrorMessage 
          title={t('mealPlans.failedToLoadMealPlans')} 
          message={error.message}
          onRetry={() => fetchMealPlans()} 
        />
      )}
      
      {mealPlans && mealPlans.length === 0 && (
        <Card className="py-12 lg:py-16 text-center">
          <CardContent>
            <div className="max-w-md mx-auto">
              <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-neutral-300 mx-auto mb-4 sm:mb-6" />
              <h3 className="text-lg sm:text-xl font-medium text-neutral-900 mb-2 sm:mb-4">
                {t('mealPlans.noMealPlans')}
              </h3>
              <p className="text-sm sm:text-base text-neutral-500 mb-6 sm:mb-8 leading-relaxed">
                {t('mealPlans.noMealPlansDescription')}
              </p>
              <Button 
                onClick={() => {
                  setEditingMealPlan(null);
                  setIsCreateModalOpen(true);
                }}
                leftIcon={<PlusCircle size={18} />}
                className="w-full sm:w-auto"
              >
                {t('mealPlans.createFirstMealPlan')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {mealPlans && mealPlans.length > 0 && (
        <div className="space-y-6 animate-fadeIn">
          {currentPlans.length === 0 && (
            <Card className="py-8 text-center">
              <CardContent>
                <p className="text-neutral-600 mb-4">{t('mealPlans.noCurrentPlan')}</p>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  leftIcon={<PlusCircle size={18} />}
                  className="w-full sm:w-auto"
                >
                  {t('mealPlans.createMealPlan')}
                </Button>
              </CardContent>
            </Card>
          )}
          {currentPlans.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {currentPlans.map(({ plan, versionCount }) => (
                <MealPlanCard
                  key={plan.id}
                  mealPlan={plan}
                  versionCount={versionCount}
                  isCurrent={plan.start_date.slice(0, 10) <= todayKey}
                />
              ))}
            </div>
          )}

          {pastPlans.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowArchive(!showArchive)}
                aria-expanded={showArchive}
                className="flex w-full items-center justify-between rounded-lg border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                <span className="flex items-center gap-2">
                  <Archive className="h-4 w-4" aria-hidden="true" />
                  {t('mealPlans.archive', { count: pastPlans.length })}
                </span>
                <ChevronDown className={`h-4 w-4 transition-transform ${showArchive ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {showArchive && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
                  {pastPlans.map(({ plan, versionCount }) => (
                    <MealPlanCard key={plan.id} mealPlan={plan} versionCount={versionCount} isPast />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <CreateMealPlanModal
        isOpen={isCreateModalOpen}
        onClose={handleCreateModalClose}
        onSuccess={handleCreateSuccess}
        editingMealPlan={editingMealPlan}
        previousPlan={currentPlans[0]?.plan ?? pastPlans[0]?.plan ?? null}
      />
    </Container>
  );
};

export default MealPlans;
