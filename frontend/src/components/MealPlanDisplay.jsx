import React, { useState, useEffect } from 'react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_TIMES = ['Breakfast', 'Lunch', 'Snack', 'Dinner']

function MealPlanDisplay({ mealPlan, onSave, onUpdate, isCreating, status = 'draft', onStatusChange, onCancel, savedRecipes = [] }) {
  const [activeCell, setActiveCell] = useState(null) // { day, mealTime }
  const [isEditing, setIsEditing] = useState(false)
  const [editedMealPlan, setEditedMealPlan] = useState(null)

  // Initialize edited meal plan when mealPlan changes
  useEffect(() => {
    if (mealPlan) {
      setEditedMealPlan(JSON.parse(JSON.stringify(mealPlan)))
      setIsEditing(false)
    } else if (isCreating) {
      setEditedMealPlan({ meal_plan_title: '', recipe_plan: [] })
      setIsEditing(true)
    }
  }, [mealPlan, isCreating])
  
  if (!mealPlan && !isCreating) return null
  if (!editedMealPlan) return null

  const isNewMealPlan = isCreating && !mealPlan
  const showEditMode = isEditing || isNewMealPlan
  const displayMealPlan = showEditMode ? editedMealPlan : mealPlan

  const recipes = displayMealPlan?.recipe_plan || []
  const title = displayMealPlan?.meal_plan_title || ''

  const handleEditClick = () => {
    setIsEditing(true)
    if (onStatusChange) {
      onStatusChange('draft')
    }
  }

  const handleSaveEdits = () => {
    if (onUpdate) {
      onUpdate(editedMealPlan)
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    if (mealPlan) {
      setEditedMealPlan(JSON.parse(JSON.stringify(mealPlan)))
      setIsEditing(false)
      if (onStatusChange) {
        onStatusChange('saved')
      }
    } else if (onCancel) {
      onCancel()
    }
  }

  const handleTitleChange = (newTitle) => {
    setEditedMealPlan(prev => ({ ...prev, meal_plan_title: newTitle }))
  }

  // Get meals for a specific day and time
  const getMealsForCell = (day, mealTime) => {
    return recipes.filter(slot => 
      slot.meal_day?.includes(day) && slot.meal_time?.includes(mealTime)
    )
  }

  // Handle clicking a cell to add recipe
  const handleCellClick = (day, mealTime) => {
    if (!showEditMode) return
    setActiveCell({ day, mealTime })
  }

  // Add recipe to specific day/time
  const handleAddRecipe = (recipe, day, mealTime) => {
    const newMealSlot = {
      meal_day: [day],
      meal_time: [mealTime],
      title: recipe.title,
      dietary_preferences: recipe.dietary_preferences || [],
      description: recipe.description,
      comments: recipe.comments || '',
      number_of_servings: recipe.number_of_servings,
      nutritional_info: recipe.nutritional_info,
      complexity: recipe.complexity,
      recipe_id: recipe.recipe_id || null
    }
    const updatedRecipes = [...recipes, newMealSlot]
    setEditedMealPlan(prev => ({ ...prev, recipe_plan: updatedRecipes }))
    setActiveCell(null)
  }

  // Remove a meal from the plan
  const handleRemoveMeal = (slotToRemove, day, mealTime) => {
    if (!showEditMode) return
    
    // Find the index of this slot
    const slotIndex = recipes.findIndex(slot => 
      slot.title === slotToRemove.title &&
      slot.meal_day?.includes(day) &&
      slot.meal_time?.includes(mealTime)
    )
    
    if (slotIndex === -1) return
    
    const slot = recipes[slotIndex]
    
    // If slot spans multiple days/times, just remove this day/time
    if (slot.meal_day.length > 1 || slot.meal_time.length > 1) {
      const updatedSlot = {
        ...slot,
        meal_day: slot.meal_day.filter(d => d !== day || slot.meal_time.length > 1),
        meal_time: slot.meal_time.filter(t => t !== mealTime || slot.meal_day.length > 1)
      }
      // If still has days/times, update; otherwise remove
      if (updatedSlot.meal_day.length > 0 && updatedSlot.meal_time.length > 0) {
        const updatedRecipes = [...recipes]
        updatedRecipes[slotIndex] = updatedSlot
        setEditedMealPlan(prev => ({ ...prev, recipe_plan: updatedRecipes }))
        return
      }
    }
    
    // Remove the entire slot
    const updatedRecipes = recipes.filter((_, i) => i !== slotIndex)
    setEditedMealPlan(prev => ({ ...prev, recipe_plan: updatedRecipes }))
  }

  return (
    <div className="recipe-plan-container">
      <div className={`recipe-status-tag ${showEditMode ? 'draft' : status}`}>
        {showEditMode ? '📝 Draft' : '✓ Saved'}
      </div>
      <div className="plan-header">
        <div className="plan-title-section">
          <span className="plan-icon">📅</span>
          {showEditMode ? (
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
            {showEditMode ? (
              <>
                {(recipes.length > 0 || title) && (
                  <button className="save-btn" onClick={() => { handleSaveEdits(); onSave(); }}>💾 Save</button>
                )}
                <button className="cancel-btn" onClick={handleCancelEdit}>✕ Cancel</button>
              </>
            ) : (
              <>
                <button className="edit-btn" onClick={handleEditClick}>✏️ Edit</button>
                <button className="save-btn" onClick={onSave}>💾 Save</button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Weekly Grid */}
      <div className="weekly-meal-grid">
        {/* Header Row - Days */}
        <div className="grid-header">
          <div className="grid-corner"></div>
          {DAYS.map(day => (
            <div key={day} className="day-header">{day.slice(0, 3)}</div>
          ))}
        </div>
        
        {/* Meal Time Rows */}
        {MEAL_TIMES.map(mealTime => (
          <div key={mealTime} className="meal-time-row">
            <div className="meal-time-label">{mealTime}</div>
            {DAYS.map(day => {
              const meals = getMealsForCell(day, mealTime)
              const isActive = activeCell?.day === day && activeCell?.mealTime === mealTime
              
              return (
                <div 
                  key={`${day}-${mealTime}`} 
                  className={`meal-cell ${meals.length > 0 ? 'filled' : ''} ${showEditMode ? 'editable' : ''} ${isActive ? 'active' : ''}`}
                  onClick={() => meals.length === 0 && handleCellClick(day, mealTime)}
                >
                  {meals.length > 0 ? (
                    <div className="meal-cell-content">
                      {meals.map((meal, idx) => (
                        <div key={idx} className="meal-item">
                          <span className="meal-name" title={meal.title}>{meal.title}</span>
                          {showEditMode && (
                            <button 
                              className="remove-meal-btn"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveMeal(meal, day, mealTime)
                              }}
                            >×</button>
                          )}
                        </div>
                      ))}
                      {showEditMode && (
                        <button 
                          className="add-more-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCellClick(day, mealTime)
                          }}
                        >+</button>
                      )}
                    </div>
                  ) : (
                    showEditMode && <span className="add-icon">+</span>
                  )}
                  
                  {/* Recipe Selector Dropdown */}
                  {isActive && (
                    <div className="cell-recipe-selector" onClick={(e) => e.stopPropagation()}>
                      <div className="selector-header">
                        <span>Add to {day} {mealTime}</span>
                        <button onClick={() => setActiveCell(null)}>×</button>
                      </div>
                      <div className="selector-list">
                        {savedRecipes.length === 0 ? (
                          <div className="selector-empty">No saved recipes</div>
                        ) : (
                          savedRecipes.map((item, idx) => (
                            <div 
                              key={idx}
                              className="selector-item"
                              onClick={() => handleAddRecipe(item.recipe, day, mealTime)}
                            >
                              <span className="selector-title">{item.recipe.title}</span>
                              <span className="selector-meta">{item.recipe.complexity}</span>
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
      
      {showEditMode && (
        <p className="plan-hint">Click + to add recipes, or use @mealplan_agent in chat to generate a meal plan</p>
      )}
    </div>
  )
}

export default MealPlanDisplay
