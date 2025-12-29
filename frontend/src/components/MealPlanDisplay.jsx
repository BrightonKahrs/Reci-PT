import React, { useState } from 'react'

function MealPlanDisplay({ mealPlan, onSave, onUpdate, isCreating, status = 'draft', onStatusChange, onCancel, savedRecipes = [] }) {
  const [selectingCell, setSelectingCell] = useState(null) // { day, mealType }
  
  if (!mealPlan && !isCreating) return null

  // Show the weekly grid for both creating (empty) and viewing (filled)
  const displayPlan = mealPlan?.recipe_plan || []
  const title = mealPlan?.meal_plan_title || ''
  const isEditable = isCreating || status === 'draft'

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const mealTypes = ['breakfast', 'lunch', 'snack', 'dinner']

  const handleTitleChange = (newTitle) => {
    if (onUpdate) {
      onUpdate({ ...mealPlan, meal_plan_title: newTitle })
    }
  }

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
    const updatedRecipePlan = [
      ...displayPlan.filter(p => !(p.meal_type === mealType && p.meal_day === day)),
      newMeal
    ]
    
    if (onUpdate) {
      onUpdate({ ...mealPlan, recipe_plan: updatedRecipePlan })
    }
    
    setSelectingCell(null)
  }

  const handleRemoveMeal = (day, mealType, e) => {
    e.stopPropagation()
    if (!isEditable) return
    
    const updatedRecipePlan = displayPlan.filter(p => 
      !(p.meal_type === mealType && (Array.isArray(p.meal_day) ? p.meal_day.includes(day) : p.meal_day === day))
    )
    
    if (onUpdate) {
      onUpdate({ ...mealPlan, recipe_plan: updatedRecipePlan })
    }
  }

  const getMeal = (day, mealType) => {
    return displayPlan?.find(p => 
      p.meal_type === mealType && 
      (Array.isArray(p.meal_day) ? p.meal_day.includes(day) : p.meal_day === day)
    )
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
            <h2>{title || 'Weekly Meal Plan'}</h2>
          )}
        </div>
        <div className="plan-header-right">
          <p className="plan-count">{displayPlan.length} meals</p>
          <div className="plan-actions">
            {(displayPlan.length > 0 || title) && (
              <button className="save-btn" onClick={onSave}>💾 Save</button>
            )}
            {isCreating && (
              <button className="cancel-btn" onClick={onCancel}>✕</button>
            )}
          </div>
        </div>
      </div>
      
      {/* Compact Grid - Days as rows, Meal types as columns */}
      <div className="meal-plan-grid">
        {/* Header row with meal types */}
        <div className="meal-plan-header">
          <div className="day-label-cell"></div>
          {mealTypes.map(type => (
            <div key={type} className={`meal-type-header ${type}`}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </div>
          ))}
        </div>
        
        {/* Day rows */}
        {days.map((day, dayIndex) => (
          <div key={day} className="meal-plan-row">
            <div className="day-label-cell">
              <span className="day-label">{dayLabels[dayIndex]}</span>
            </div>
            
            {mealTypes.map(mealType => {
              const meal = getMeal(day, mealType)
              const isSelecting = selectingCell?.day === day && selectingCell?.mealType === mealType
              
              return (
                <div 
                  key={`${day}-${mealType}`}
                  className={`meal-plan-cell ${meal ? 'filled' : 'empty'} ${isEditable && !meal ? 'editable' : ''} ${isSelecting ? 'selecting' : ''}`}
                  onClick={() => !meal && handleCellClick(day, mealType)}
                >
                  {meal ? (
                    <div className="meal-content">
                      <span className="meal-name" title={meal.recipe_title}>
                        {meal.recipe_title}
                      </span>
                      {isEditable && (
                        <button 
                          className="remove-meal-btn" 
                          onClick={(e) => handleRemoveMeal(day, mealType, e)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ) : isEditable ? (
                    <span className="add-icon">+</span>
                  ) : null}
                  
                  {/* Recipe Selection Dropdown */}
                  {isSelecting && (
                    <div className="recipe-select-dropdown">
                      <div className="recipe-select-header">
                        <span>Select recipe</span>
                        <button onClick={(e) => { e.stopPropagation(); setSelectingCell(null); }}>×</button>
                      </div>
                      <div className="recipe-select-list">
                        {savedRecipes.length === 0 ? (
                          <div className="recipe-select-empty">No saved recipes</div>
                        ) : (
                          savedRecipes.map((item, idx) => (
                            <div 
                              key={idx} 
                              className="recipe-select-item"
                              onClick={(e) => { e.stopPropagation(); handleRecipeSelect(item.recipe); }}
                            >
                              {item.recipe.title}
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
      
      {isEditable && (
        <p className="plan-hint">Click + to add recipes or use @mealplan_agent in chat</p>
      )}
    </div>
  )
}

export default MealPlanDisplay
