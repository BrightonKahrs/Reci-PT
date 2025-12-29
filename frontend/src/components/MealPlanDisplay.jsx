import React, { useState } from 'react'

function MealPlanDisplay({ recipePlan, onSave, onUpdate, isCreating, status = 'draft', onStatusChange, onCancel, savedRecipes = [] }) {
  const [selectingCell, setSelectingCell] = useState(null) // { day, mealType }
  
  if (!recipePlan && !isCreating) return null

  // Show the weekly grid for both creating (empty) and viewing (filled)
  const displayPlan = recipePlan || []
  const isEditable = isCreating || status === 'draft'

  const handleCellClick = (day, mealType) => {
    if (!isEditable) return
    setSelectingCell({ day, mealType })
  }

  const handleRecipeSelect = (recipe) => {
    if (!selectingCell) return
    
    const { day, mealType } = selectingCell
    
    // Create new meal entry
    const newMeal = {
      recipe_title: recipe.title,
      meal_type: mealType,
      meal_day: day,
      servings: recipe.number_of_servings,
      estimated_macros: recipe.nutritional_info
    }
    
    // Remove any existing meal at this slot and add the new one
    const updatedPlan = [
      ...displayPlan.filter(p => !(p.meal_type === mealType && p.meal_day === day)),
      newMeal
    ]
    
    if (onUpdate) {
      onUpdate(updatedPlan)
    }
    
    setSelectingCell(null)
  }

  const handleRemoveMeal = (day, mealType, e) => {
    e.stopPropagation()
    if (!isEditable) return
    
    const updatedPlan = displayPlan.filter(p => 
      !(p.meal_type === mealType && (Array.isArray(p.meal_day) ? p.meal_day.includes(day) : p.meal_day === day))
    )
    
    if (onUpdate) {
      onUpdate(updatedPlan)
    }
  }

  return (
    <div className="recipe-plan-container">
      <div className={`recipe-status-tag ${status}`}>
        {status === 'draft' ? '📝 Draft' : '✓ Saved'}
      </div>
      <div className="plan-header">
        <h2>📅 {isCreating && !recipePlan ? 'New Meal Plan' : 'Your Weekly Meal Plan'}</h2>
        <div className="plan-header-right">
          {isCreating && !recipePlan ? (
            <p className="plan-hint">Click + to add recipes or use @mealplan_agent in chat</p>
          ) : (
            <p className="plan-count">{displayPlan.length} meals planned</p>
          )}
          <div className="plan-actions">
            {displayPlan.length > 0 && (
              <button className="save-btn" onClick={onSave}>💾 Save Plan</button>
            )}
            {isCreating && (
              <button className="cancel-btn" onClick={onCancel}>✕ Cancel</button>
            )}
          </div>
        </div>
      </div>
      
      <div className="weekly-grid">
        <div className="weekly-grid-header">
          <div className="meal-type-label"></div>
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
        </div>
        
        {['breakfast', 'lunch', 'snack', 'dinner'].map(mealType => (
          <div key={mealType} className="meal-row">
            <div className="meal-type-label">
              <span className={`meal-badge ${mealType}`}>
                {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </span>
            </div>
            
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => {
              const plan = displayPlan?.find(p => 
                p.meal_type === mealType && 
                (Array.isArray(p.meal_day) ? p.meal_day.includes(day) : p.meal_day === day)
              )
              const isSelecting = selectingCell?.day === day && selectingCell?.mealType === mealType
              
              return (
                <div 
                  key={`${day}-${mealType}`} 
                  className={`meal-cell ${plan ? 'filled' : 'empty'} ${isEditable && !plan ? 'editable' : ''} ${isSelecting ? 'selecting' : ''}`}
                  onClick={() => !plan && handleCellClick(day, mealType)}
                >
                  {plan ? (
                    <>
                      <div className="meal-title">{plan.recipe_title}</div>
                      {plan.servings && (
                        <div className="meal-servings">🍽️ {plan.servings}</div>
                      )}
                      {plan.estimated_macros && (
                        <div className="meal-macros">
                          <span>{plan.estimated_macros.calories} cal</span>
                          <span>P: {plan.estimated_macros.protein}g</span>
                        </div>
                      )}
                      {isEditable && (
                        <button 
                          className="remove-meal-btn" 
                          onClick={(e) => handleRemoveMeal(day, mealType, e)}
                          title="Remove meal"
                        >
                          ×
                        </button>
                      )}
                    </>
                  ) : isEditable ? (
                    <div className="add-meal-placeholder">
                      <span className="add-meal-icon">+</span>
                    </div>
                  ) : (
                    <div className="empty-placeholder">-</div>
                  )}
                  
                  {/* Recipe Selection Dropdown */}
                  {isSelecting && (
                    <div className="recipe-select-dropdown">
                      <div className="recipe-select-header">
                        <span>Select a recipe</span>
                        <button onClick={(e) => { e.stopPropagation(); setSelectingCell(null); }}>×</button>
                      </div>
                      <div className="recipe-select-list">
                        {savedRecipes.length === 0 ? (
                          <div className="recipe-select-empty">No saved recipes yet</div>
                        ) : (
                          savedRecipes.map((item, idx) => (
                            <div 
                              key={idx} 
                              className="recipe-select-item"
                              onClick={(e) => { e.stopPropagation(); handleRecipeSelect(item.recipe); }}
                            >
                              <span className="recipe-select-title">{item.recipe.title}</span>
                              <span className="recipe-select-meta">{item.recipe.complexity}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default MealPlanDisplay
