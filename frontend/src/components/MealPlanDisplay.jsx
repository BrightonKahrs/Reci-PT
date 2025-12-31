import React, { useState, useEffect, useRef } from 'react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const MEAL_TIMES = ['Breakfast', 'Lunch', 'Snack', 'Dinner']

function MealPlanDisplay({ mealPlan, onSave, onUpdate, isCreating, status = 'draft', onStatusChange, onCancel, savedRecipes = [], onOpenRecipe, onGenerateGroceryList }) {
  const [activeCell, setActiveCell] = useState(null) // { day, mealTime, rect }
  const [isEditing, setIsEditing] = useState(false)
  const [editedMealPlan, setEditedMealPlan] = useState(null)

  // Initialize edited meal plan when mealPlan changes
  useEffect(() => {
    if (isCreating) {
      // New meal plan - start in edit mode
      setEditedMealPlan(mealPlan ? JSON.parse(JSON.stringify(mealPlan)) : { meal_plan_title: '', recipe_plan: [] })
      setIsEditing(true)
    } else if (mealPlan) {
      // Viewing existing meal plan - start in view mode
      setEditedMealPlan(JSON.parse(JSON.stringify(mealPlan)))
      setIsEditing(false)
    }
  }, [mealPlan, isCreating])
  
  if (!mealPlan && !isCreating) return null
  if (!editedMealPlan) return null

  const showEditMode = isEditing || isCreating
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
    // Pass the edited meal plan directly to onSave since state update is async
    if (onSave) {
      onSave(editedMealPlan)
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    if (isCreating) {
      // Creating new - cancel should close it
      if (onCancel) {
        onCancel()
      }
    } else if (mealPlan) {
      // Editing existing - cancel should revert changes
      setEditedMealPlan(JSON.parse(JSON.stringify(mealPlan)))
      setIsEditing(false)
      if (onStatusChange) {
        onStatusChange('saved')
      }
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

  // Get total macros for a specific day
  const getDailyTotals = (day) => {
    const dayMeals = recipes.filter(slot => slot.meal_day?.includes(day))
    return dayMeals.reduce((totals, meal) => {
      const macros = meal.nutritional_info || {}
      return {
        calories: totals.calories + (macros.calories || 0),
        protein: totals.protein + (macros.protein || 0),
        carbohydrates: totals.carbohydrates + (macros.carbohydrates || 0),
        fat: totals.fat + (macros.fat || 0)
      }
    }, { calories: 0, protein: 0, carbohydrates: 0, fat: 0 })
  }

  // Handle clicking a cell to add recipe
  const handleCellClick = (day, mealTime, event) => {
    if (!showEditMode) return
    const rect = event.currentTarget.getBoundingClientRect()
    setActiveCell({ day, mealTime, rect })
  }

  // Add recipe to specific day/time
  const handleAddRecipe = (recipe, day, mealTime, recipeKey = null) => {
    // Convert dietary_preferences to array if it's a string
    let dietaryPrefs = recipe.dietary_preferences || []
    if (typeof dietaryPrefs === 'string') {
      dietaryPrefs = dietaryPrefs.split(',').map(p => p.trim()).filter(p => p)
    }

    const newMealSlot = {
      meal_day: [day],
      meal_time: [mealTime],
      title: recipe.title,
      dietary_preferences: dietaryPrefs,
      description: recipe.description || '',
      comments: recipe.comments || '',
      number_of_servings: recipe.number_of_servings || 1,
      nutritional_info: recipe.nutritional_info || { calories: 0, protein: 0, fat: 0, carbohydrates: 0 },
      complexity: recipe.complexity || 'Easy',
      recipe_id: recipeKey || recipe.recipe_id || 'recipe:draft'
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
          <div className={`status-badge ${showEditMode ? 'draft' : status}`}>
            {showEditMode ? 'Draft' : (status === 'saved' ? 'Saved' : 'Draft')}
          </div>
          <div className="plan-actions">
            {showEditMode ? (
              <>
                {(recipes.length > 0 || title) && (
                  <button className="save-btn" onClick={handleSaveEdits}>💾 Save</button>
                )}
                <button className="cancel-btn" onClick={handleCancelEdit}>✕</button>
              </>
            ) : (
              <>
                <button className="edit-btn" onClick={handleEditClick}>✏️ Edit</button>
                {status === 'draft' && (
                  <button className="save-btn" onClick={() => onSave()}>💾 Save</button>
                )}
                <button className="close-btn" onClick={onCancel}>✕</button>
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
                  onClick={(e) => meals.length === 0 && handleCellClick(day, mealTime, e)}
                >
                  {meals.length > 0 ? (
                    <div className="meal-cell-content">
                      {meals.map((meal, idx) => {
                        const macros = meal.nutritional_info || {}
                        const isDraft = !meal.recipe_id || meal.recipe_id === 'recipe:draft' || meal.recipe_id.endsWith(':draft')
                        return (
                          <div 
                            key={idx} 
                            className={`meal-item ${isDraft ? 'draft' : ''} clickable`}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (onOpenRecipe) {
                                onOpenRecipe(meal, isDraft)
                              }
                            }}
                          >
                            <div className="meal-item-header">
                              <span className="meal-name" title={meal.title}>
                                {meal.title}
                              </span>
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
                            {(macros.calories || macros.protein || macros.carbohydrates || macros.fat) && (
                              <div className="meal-macros">
                                {macros.calories > 0 && <span className="macro cal">{macros.calories}cal</span>}
                                {macros.protein > 0 && <span className="macro pro">{macros.protein}g P</span>}
                                {macros.carbohydrates > 0 && <span className="macro carb">{macros.carbohydrates}g C</span>}
                                {macros.fat > 0 && <span className="macro fat">{macros.fat}g F</span>}
                              </div>
                            )}
                          </div>
                        )
                      })}
                      {showEditMode && (
                        <button 
                          className="add-more-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCellClick(day, mealTime, e)
                          }}
                        >+</button>
                      )}
                    </div>
                  ) : (
                    showEditMode && <span className="add-icon">+</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
        
        {/* Daily Totals Row */}
        <div className="meal-time-row totals-row">
          <div className="meal-time-label">Daily Total</div>
          {DAYS.map(day => {
            const totals = getDailyTotals(day)
            const hasData = totals.calories > 0 || totals.protein > 0
            return (
              <div key={`${day}-totals`} className="meal-cell totals-cell">
                {hasData ? (
                  <div className="daily-totals">
                    <div className="total-row">
                      <span className="macro cal">{totals.calories} cal</span>
                      <span className="macro pro">{totals.protein}g P</span>
                    </div>
                    <div className="total-row">
                      <span className="macro carb">{totals.carbohydrates}g C</span>
                      <span className="macro fat">{totals.fat}g F</span>
                    </div>
                  </div>
                ) : (
                  <span className="no-meals">—</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Recipe Selector Dropdown - rendered outside grid for overflow */}
      {activeCell && (
        <div 
          className="cell-recipe-selector" 
          style={{
            top: activeCell.rect ? activeCell.rect.bottom + 4 : 0,
            left: activeCell.rect ? activeCell.rect.left : 0,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="selector-header">
            <span>Add to {activeCell.day} {activeCell.mealTime}</span>
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
                  onClick={() => handleAddRecipe(item.recipe, activeCell.day, activeCell.mealTime, item.key)}
                >
                  <span className="selector-title">{item.recipe.title}</span>
                  <span className="selector-meta">{item.recipe.complexity}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      
      {showEditMode && (
        <p className="plan-hint">Click + to add recipes, or use @mealplan_agent in chat to generate a meal plan</p>
      )}

      {!showEditMode && status === 'saved' && onGenerateGroceryList && recipes.length > 0 && (
        <div className="meal-plan-actions">
          <button className="generate-grocery-btn" onClick={onGenerateGroceryList}>
            🛒 Generate Grocery List
          </button>
        </div>
      )}
    </div>
  )
}

export default MealPlanDisplay
