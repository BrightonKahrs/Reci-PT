import React from 'react';

function SavedGroceryLists({ groceryLists, onSelectGroceryList, onDeleteGroceryList }) {
  if (!groceryLists || groceryLists.length === 0) {
    return (
      <div className="saved-grocery-lists">
        <h2>Saved Grocery Lists</h2>
        <p className="no-items-message">No saved grocery lists yet. Save a meal plan to generate a grocery list.</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getItemCount = (groceryList) => {
    return groceryList?.items?.length || 0;
  };

  const getPreviewItems = (groceryList) => {
    const items = groceryList?.items || [];
    return items.slice(0, 3).map(item => item.name).join(', ');
  };

  return (
    <div className="saved-grocery-lists">
      <h2>Saved Grocery Lists</h2>
      <div className="grocery-lists-grid">
        {groceryLists.map(({ key, grocery_list }) => (
          <div key={key} className="grocery-list-card">
            <div className="grocery-list-card-header">
              <h3>Grocery List</h3>
              {grocery_list.meal_plan_id && (
                <span className="meal-plan-tag">
                  {grocery_list.meal_plan_id.replace('meal_plan:', '')}
                </span>
              )}
            </div>
            <div className="grocery-list-card-body">
              <p className="item-count">{getItemCount(grocery_list)} items</p>
              <p className="item-preview">{getPreviewItems(grocery_list)}...</p>
            </div>
            <div className="grocery-list-card-actions">
              <button 
                className="view-button"
                onClick={() => onSelectGroceryList(grocery_list, key)}
              >
                View
              </button>
              <button 
                className="delete-button"
                onClick={() => onDeleteGroceryList(key)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SavedGroceryLists;
