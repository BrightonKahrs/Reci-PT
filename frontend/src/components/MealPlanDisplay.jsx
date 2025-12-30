import React, { useState } from 'react'

function MealPlanDisplay({ mealPlan, onSave, onUpdate, isCreating, status = 'draft', onStatusChange, onCancel, savedRecipes = [] }) {
  const [showRecipeSelector, setShowRecipeSelector] = useState(false)
  
  if (!mealPlan && !isCreating) return null

  // recipe_plan is now a list of full Recipe objects
  const recipes = mealPlan?.recipe_plan || []
  const title = mealPlan?.meal_plan_title || ''
  const isEditable = isCreating || status === 'draft'

  const handleTitleChange = (newTitle) => {
    if (onUpdate) {
      onUpdate({ ...mealPlan, meal_plan_title: newTitle })
    }
  }

  const handleAddRecipe = (recipe) => {
    // Convert Recipe to MealSlot format
    const newMealSlot = {
      meal_day: ['Monday'],  // Default - user can edit
      meal_time: ['Dinner'], // Default - user can edit
      title: recipe.title,
      dietary_preferences: recipe.dietary_preferences || [],
      description: recipe.description,
      comments: recipe.comments || '',
      number_of_servings: recipe.number_of_servings,
      nutritional_info: recipe.nutritional_info,
      complexity: recipe.complexity,
      recipe_id: recipe.recipe_id || null  // Link to saved recipe if available
    }
    const updatedRecipes = [...recipes, newMealSlot]
    if (onUpdate) {
      onUpdate({ ...mealPlan, recipe_plan: updatedRecipes })
    }
    setShowRecipeSelector(false)
  }

  const handleRemoveRecipe = (index) => {
    if (!isEditable) return
    const updatedRecipes = recipes.filter((_, i) => i !== index)
    if (onUpdate) {
      onUpdate({ ...mealPlan, recipe_plan: updatedRecipes })
    }
  }

  return (
    <div className="recipe-plan-container">
      <div className={`recipe-status-tag ${status}`}>
        {status === 'draft' ? '📝 Draft' : '✓ Saved'}
      </div>
      <div className="plan-header">
        <div className="plan-title-section">
          <span className="plan-icon">📅</span>
          {isEditable ? (
            <input
              type="text"
              className="plan-title-input"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Enter meal plan title..."
            />
          ) : (
            <h2>{title || 'Meal Plan'}</h2>
          )}
        </div>
        <div className="plan-header-right">
          <p className="plan-count">{recipes.length} recipes</p>
          <div className="plan-actions">
            {(recipes.length > 0 || title) && (
              <button className="save-btn" onClick={onSave}>💾 Save</button>
            )}
            {isCreating && (
              <button className="cancel-btn" onClick={onCancel}>✕</button>
            )}
          </div>
        </div>
      </div>
      
      {/* Recipe List */}
      <div className="meal-plan-recipes">
        {recipes.length === 0 ? (
          <div className="meal-plan-empty">
            <p>No recipes in this plan yet.</p>
            {isEditable && <p className="hint">Add recipes from your saved recipes or use @mealplan_agent in chat.</p>}
          </div>
        ) : (
          <div className="meal-plan-recipe-list">
            {recipes.map((slot, index) => (
              <div key={index} className="meal-plan-recipe-card">
                <div className="meal-plan-recipe-header">
                  <h4>{slot.title}</h4>
                  {isEditable && (
                    <button 
                      className="remove-recipe-btn"
                      onClick={() => handleRemoveRecipe(index)}
                      title="Remove from plan"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="meal-slot-schedule">
                  <span className="meal-days">{slot.meal_day?.join(', ')}</span>
                  <span className="meal-times">{slot.meal_time?.join(', ')}</span>
                </div>
                <p className="meal-plan-recipe-desc">{slot.description}</p>
                <div className="meal-plan-recipe-meta">
                  <span className="complexity-badge">{slot.complexity}</span>
                  <span className="servings">{slot.number_of_servings} servings</span>
                  {slot.nutritional_info && (
                    <span className="calories">{slot.nutritional_info.calories} cal</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Add Recipe Button */}
        {isEditable && (
          <div className="add-recipe-section">
            <button 
              className="add-recipe-btn"
              onClick={() => setShowRecipeSelector(!showRecipeSelector)}
            >
              + Add Recipe
            </button>
            
            {showRecipeSelector && (
              <div className="recipe-selector-dropdown">
                <div className="recipe-selector-header">
                  <span>Select a saved recipe</span>
                  <button onClick={() => setShowRecipeSelector(false)}>×</button>
                </div>
                <div className="recipe-selector-list">
                  {savedRecipes.length === 0 ? (
                    <div className="recipe-selector-empty">No saved recipes available</div>
                  ) : (
                    savedRecipes.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="recipe-selector-item"
                        onClick={() => handleAddRecipe(item.recipe)}
                      >
                        <span className="recipe-selector-title">{item.recipe.title}</span>
                        <span className="recipe-selector-meta">
                          {item.recipe.complexity} • {item.recipe.number_of_servings} servings
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {isEditable && (
        <p className="plan-hint">Use @mealplan_agent in chat to generate a meal plan</p>
      )}
    </div>
  )
}

export default MealPlanDisplay
