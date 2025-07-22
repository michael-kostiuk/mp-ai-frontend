import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ApiProvider } from './context/ApiContext';
import { IngredientProvider } from './context/IngredientContext';
import Header from './components/layout/Header';
import Home from './pages/Home';
import Recipes from './pages/Recipes';
import MealPlans from './pages/MealPlans';
import ShoppingLists from './pages/ShoppingLists';
import Ingredients from './pages/Ingredients';
import './styles/index.css';

function App() {
  return (
    <ApiProvider>
      <IngredientProvider>
        <Router>
          <div className="min-h-screen bg-neutral-50">
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/recipes" element={<Recipes />} />
                <Route path="/meal-plans" element={<MealPlans />} />
                <Route path="/shopping-lists" element={<ShoppingLists />} />
                <Route path="/ingredients" element={<Ingredients />} />
              </Routes>
            </main>
          </div>
        </Router>
      </IngredientProvider>
    </ApiProvider>
  );
}

export default App;