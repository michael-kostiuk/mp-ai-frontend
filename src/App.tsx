import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { IngredientProvider } from './context/IngredientContext';
import Header from './components/layout/Header';
import Home from './pages/Home';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import MealPlans from './pages/MealPlans';
import MealPlanDetail from './pages/MealPlanDetail';
import ShoppingLists from './pages/ShoppingLists';
import ShoppingListDetail from './pages/ShoppingListDetail';
import Ingredients from './pages/Ingredients';
import './styles/index.css';

function App() {
  return (
    <IngredientProvider>
      <Router>
        <div className="min-h-screen bg-neutral-50">
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/recipes/:id" element={<RecipeDetail />} />
              <Route path="/meal-plans" element={<MealPlans />} />
              <Route path="/meal-plans/:id" element={<MealPlanDetail />} />
              <Route path="/shopping-lists" element={<ShoppingLists />} />
              <Route path="/shopping-lists/:id" element={<ShoppingListDetail />} />
              <Route path="/ingredients" element={<Ingredients />} />
            </Routes>
          </main>
        </div>
      </Router>
    </IngredientProvider>
  );
}

export default App;
