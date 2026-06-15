import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MealPlanDetailModal from '../components/mealPlans/MealPlanDetailModal';
import CreateMealPlanModal from '../components/mealPlans/CreateMealPlanModal';
import { MealPlan } from '../types';

const MealPlanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editingMealPlan, setEditingMealPlan] = useState<MealPlan | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const mealPlanId = id ? parseInt(id, 10) : null;

  useEffect(() => {
    // If no valid ID, redirect to meal plans list
    if (!mealPlanId || isNaN(mealPlanId)) {
      navigate('/meal-plans', { replace: true });
    }
  }, [mealPlanId, navigate]);

  const handleClose = () => {
    navigate('/meal-plans');
  };

  const handleEdit = (mealPlan: MealPlan) => {
    setEditingMealPlan(mealPlan);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingMealPlan(null);
    // The detail modal will automatically refresh when it detects changes
  };

  const handleDelete = () => {
    navigate('/meal-plans');
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setEditingMealPlan(null);
  };

  if (!mealPlanId) {
    return null;
  }

  return (
    <>
      <MealPlanDetailModal
        isOpen={true}
        onClose={handleClose}
        mealPlanId={mealPlanId}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CreateMealPlanModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        onSuccess={handleEditSuccess}
        editingMealPlan={editingMealPlan}
      />
    </>
  );
};

export default MealPlanDetail;