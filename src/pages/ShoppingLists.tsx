import React, { useState, useEffect, useCallback } from 'react';
import { Download, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import Container from '../components/layout/Container';
import PageHeader from '../components/layout/PageHeader';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Loader from '../components/ui/Loader';
import ErrorMessage from '../components/ui/ErrorMessage';
import ShoppingListItem from '../components/shoppingLists/ShoppingListItem';
import { ShoppingList as ShoppingListType } from '../types';
import useApi from '../hooks/useApi';
import { getShoppingLists } from '../api/shoppingListApi';

const ShoppingLists: React.FC = () => {
  const { data: shoppingLists, loading, error, execute: fetchShoppingLists } = useApi<ShoppingListType[]>(getShoppingLists);
  
  // Load shopping lists only once on mount
  useEffect(() => {
    fetchShoppingLists();
  }, [fetchShoppingLists]);
  
  const handleExportList = (id: number) => {
    // In a real app, this would trigger the export functionality
    console.log('Export shopping list:', id);
  };
  
  return (
    <Container className="py-8">
      <PageHeader
        title="Shopping Lists"
        description="View and manage your shopping lists"
      />
      
      {loading && shoppingLists === null && (
        <div className="py-12">
          <Loader centered label="Loading shopping lists..." />
        </div>
      )}
      
      {error && (
        <ErrorMessage 
          title="Failed to load shopping lists" 
          message={error.message}
          onRetry={fetchShoppingLists} 
        />
      )}
      
      {shoppingLists && shoppingLists.length === 0 && (
        <div className="py-12 text-center bg-white rounded-lg shadow-sm border border-neutral-200">
          <p className="text-neutral-500 mb-4">You don't have any shopping lists yet.</p>
          <p className="text-neutral-500 text-sm mb-4">
            Create a meal plan first, then generate a shopping list from it.
          </p>
          <Link to="/meal-plans">
            <Button>Go to Meal Plans</Button>
          </Link>
        </div>
      )}
      
      {shoppingLists && shoppingLists.length > 0 && (
        <div className="space-y-6 animate-fadeIn">
          {shoppingLists.map((list) => (
            <Card key={list.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <CardTitle>Shopping List #{list.id}</CardTitle>
                    <Link to={`/shopping-lists/${list.id}`}>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        rightIcon={<ExternalLink size={14} />}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    leftIcon={<Download size={16} />}
                    onClick={() => handleExportList(list.id)}
                  >
                    Export
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {list.items.slice(0, 5).map((item) => (
                    <ShoppingListItem 
                      key={item.id} 
                      item={item} 
                    />
                  ))}
                  {list.items.length > 5 && (
                    <div className="text-center py-2 text-sm text-neutral-500 border-t border-neutral-200">
                      +{list.items.length - 5} more items
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};

export default ShoppingLists;