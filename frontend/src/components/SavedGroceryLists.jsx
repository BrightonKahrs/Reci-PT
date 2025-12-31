import React from 'react'

function SavedGroceryLists({ savedGroceryLists = [], loading, onDelete, onView, onCreateNew }) {
  const getItemCount = (groceryList) => {
    return groceryList?.items?.length || 0
  }

  const getPreviewItems = (groceryList) => {
    const items = groceryList?.items || []
    return items.slice(0, 4).map(item => item.name)
  }

  return (
    <div className="saved-items-container">
      <div className="saved-items-header">
        <h2>🛒 My Saved Grocery Lists</h2>
        <span className="item-count">{savedGroceryLists?.length || 0} lists</span>
      </div>
      
      {loading ? (
        <div className="loading">Loading saved grocery lists...</div>
      ) : (
        <div className="saved-items-grid">
          {/* Create New Card */}
          <div className="saved-item-card create-new-card" onClick={onCreateNew}>
            <div className="create-new-content">
              <span className="create-new-icon">+</span>
              <span className="create-new-text">Create new grocery list</span>
            </div>
          </div>
          
          {savedGroceryLists.map((item) => (
            <div key={item.key} className="saved-item-card grocery-list-card">
              <div className="saved-item-header">
                <h4>🛒 {item.grocery_list.title || 'Grocery List'}</h4>
                <button 
                  className="delete-btn" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(item.key)
                  }}
                  title="Delete grocery list"
                >
                  🗑️
                </button>
              </div>
              {item.grocery_list.meal_plan_id && (
                <p className="saved-item-description">
                  From: {item.grocery_list.meal_plan_id.replace('meal_plan:', '')}
                </p>
              )}
              <div className="saved-item-meta">
                <span className="item-badge">{getItemCount(item.grocery_list)} items</span>
              </div>
              <div className="saved-item-meals">
                {getPreviewItems(item.grocery_list).map((name, idx) => (
                  <span key={idx} className="meal-preview">{name}</span>
                ))}
                {(item.grocery_list.items?.length || 0) > 4 && (
                  <span className="meal-preview more">+{item.grocery_list.items.length - 4} more</span>
                )}
              </div>
              <button 
                className="load-btn"
                onClick={() => onView(item.grocery_list, item.key)}
              >
                View List
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SavedGroceryLists
