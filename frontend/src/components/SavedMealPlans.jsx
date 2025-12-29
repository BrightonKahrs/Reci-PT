import React from 'react'

function SavedMealPlans({ savedMealPlans = [], loading, onDelete, onView, onCreateNew }) {
  return (
    <div className="saved-items-container">
      <div className="saved-items-header">
        <h2>📋 My Saved Meal Plans</h2>
        <span className="item-count">{savedMealPlans?.length || 0} plans</span>
      </div>
      
      {loading ? (
        <div className="loading">Loading saved meal plans...</div>
      ) : (
        <div className="saved-items-grid">
          {/* Create New Card - Always First */}
          <div className="saved-item-card create-new-card" onClick={onCreateNew}>
            <div className="create-new-icon">+</div>
            <p>Create new meal plan</p>
          </div>
          
          {savedMealPlans.map((item) => (
            <div key={item.key} className="saved-item-card meal-plan-card">
              <div className="saved-item-header">
                <h4>{item.meal_plan.meal_plan_title || 'Untitled Plan'}</h4>
                <button 
                  className="delete-btn" 
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(item.key)
                  }}
                  title="Delete meal plan"
                >
                  🗑️
                </button>
              </div>
              <p className="saved-item-description">
                {item.meal_plan.recipe_plan?.length || 0} meals planned
              </p>
              <div className="saved-item-meals">
                {item.meal_plan.recipe_plan?.slice(0, 3).map((meal, idx) => (
                  <span key={idx} className="meal-preview">{meal.recipe_title}</span>
                ))}
                {(item.meal_plan.recipe_plan?.length || 0) > 3 && (
                  <span className="meal-preview more">+{item.meal_plan.recipe_plan.length - 3} more</span>
                )}
              </div>
              <button 
                className="load-btn"
                onClick={() => onView(item.meal_plan)}
              >
                View Plan
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SavedMealPlans
