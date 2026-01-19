import React, { useState, useEffect } from 'react';
import { PlusCircle, Calendar, Users, Target } from 'lucide-react';
import Container from '../components/layout/Container';
import PageHeader from '../components/layout/PageHeader';
import MealPlanCard from '../components/mealPlans/MealPlanCard';
import CreateMealPlanModal from '../components/mealPlans/CreateMealPlanModal';
import MealPlanDetailModal from '../components/mealPlans/MealPlanDetailModal';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import ErrorMessage from '../components/ui/ErrorMessage';
import Card, { CardContent } from '../components/ui/Card';
import { MealPlan } from '../types';
import useApi from '../hooks/useApi';
import { getMealPlans } from '../api/mealPlanApi';

const MealPlans: React.FC = () => {
  // In a real app, this would come from user authentication
  const userId = 1;
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedMealPlanId, setSelectedMealPlanId] = useState<number | null>(null);
  const [editingMealPlan, setEditingMealPlan] = useState<MealPlan | null>(null);
  
  const { data: mealPlans, loading, error, execute: fetchMealPlans } = useApi<MealPlan[]>(getMealPlans);
  
  // Load meal plans only once on mount
  useEffect(() => {
    fetchMealPlans(userId);
  }, [fetchMealPlans, userId]);
  
  const handleSelectMealPlan = (mealPlan: MealPlan) => {
    setSelectedMealPlanId(mealPlan.id);
    setIsDetailModalOpen(true);
  };

  const handleCreateSuccess = () => {
    fetchMealPlans(userId); // Refresh the list after creating
  };

  const handleDeleteSuccess = () => {
    fetchMealPlans(userId); // Refresh the list after deleting
    setIsDetailModalOpen(false);
    setSelectedMealPlanId(null);
  };

  const handleEditMealPlan = (mealPlan: MealPlan) => {
    // Close detail modal and open edit modal with meal plan data
    setIsDetailModalOpen(false);
    setEditingMealPlan(mealPlan);
    setIsCreateModalOpen(true);
  };

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false);
    setEditingMealPlan(null); // Clear editing meal plan when closing
  };

  const getTotalStats = () => {
    if (!mealPlans || mealPlans.length === 0) {
      return { totalPlans: 0, totalDays: 0, avgCalories: 0 };
    }

    const totalPlans = mealPlans.length;
    const totalDays = mealPlans.reduce((sum, plan) => {
      const start = new Date(plan.start_date);
      const end = new Date(plan.end_date);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return sum + days;
    }, 0);
    const avgCalories = Math.round(
      mealPlans.reduce((sum, plan) => sum + plan.target_calories, 0) / totalPlans
    );

    return { totalPlans, totalDays, avgCalories };
  };

  const stats = getTotalStats();
  
  return (
    <Container className="py-6 sm:py-8 lg:py-12">
      <PageHeader
        title="Meal Plans"
        description="Plan and organize your meals for the week"
        actions={
          <Button 
            leftIcon={<PlusCircle size={18} />}
            onClick={() => {
              setEditingMealPlan(null); // Ensure we're creating, not editing
              setIsCreateModalOpen(true);
            }}
            className="w-full sm:w-auto"
          >
            Create Meal Plan
          </Button>
        }
      />

      {/* Stats Cards */}
      {mealPlans && mealPlans.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-6 sm:mb-8 lg:mb-12">
          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6 text-center">
              <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900">{stats.totalPlans}</div>
              <div className="text-xs sm:text-sm text-neutral-500">Total Plans</div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6 text-center">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-accent-600 mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900">{stats.totalDays}</div>
              <div className="text-xs sm:text-sm text-neutral-500">Days Planned</div>
            </CardContent>
          </Card>

          <Card className="group hover:shadow-lg transition-all duration-300">
            <CardContent className="p-4 sm:p-6 text-center">
              <Target className="h-6 w-6 sm:h-8 sm:w-8 text-secondary-600 mx-auto mb-2 group-hover:scale-110 transition-transform duration-300" />
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900">{stats.avgCalories}</div>
              <div className="text-xs sm:text-sm text-neutral-500">Avg Calories/Day</div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {loading && mealPlans === null && (
        <div className="py-12 lg:py-16">
          <Loader centered label="Loading meal plans..." />
        </div>
      )}
      
      {error && (
        <ErrorMessage 
          title="Failed to load meal plans" 
          message={error.message}
          onRetry={() => fetchMealPlans(userId)} 
        />
      )}
      
      {mealPlans && mealPlans.length === 0 && (
        <Card className="py-12 lg:py-16 text-center">
          <CardContent>
            <div className="max-w-md mx-auto">
              <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-neutral-300 mx-auto mb-4 sm:mb-6" />
              <h3 className="text-lg sm:text-xl font-medium text-neutral-900 mb-2 sm:mb-4">
                No meal plans yet
              </h3>
              <p className="text-sm sm:text-base text-neutral-500 mb-6 sm:mb-8 leading-relaxed">
                Create your first meal plan to start organizing your meals and generating shopping lists.
              </p>
              <Button 
                onClick={() => {
                  setEditingMealPlan(null);
                  setIsCreateModalOpen(true);
                }}
                leftIcon={<PlusCircle size={18} />}
                className="w-full sm:w-auto"
              >
                Create Your First Meal Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {mealPlans && mealPlans.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8 animate-fadeIn">
          {mealPlans.map((mealPlan) => (
            <MealPlanCard 
              key={mealPlan.id} 
              mealPlan={mealPlan} 
              onClick={() => handleSelectMealPlan(mealPlan)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateMealPlanModal
        isOpen={isCreateModalOpen}
        onClose={handleCreateModalClose}
        onSuccess={handleCreateSuccess}
        editingMealPlan={editingMealPlan}
      />

      <MealPlanDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedMealPlanId(null);
        }}
        mealPlanId={selectedMealPlanId}
        onEdit={handleEditMealPlan}
        onDelete={handleDeleteSuccess}
      />
    </Container>
  );
};

export default MealPlans;
