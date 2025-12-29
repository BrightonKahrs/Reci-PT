import React, { useState, useEffect } from 'react'

const BLANK_RECIPE = {
  title: '',
  description: '',
  complexity: 'Easy',
  dietary_preferences: '',
  ingredients: [{ quantity: '', name: '' }],
  instructions: [{ step_number: 1, description: '' }],
  number_of_servings: 2,
  nutritional_info: {
    calories: 0,
    protein: 0,
    fat: 0,
    carbohydrates: 0
  }
}

function RecipeDisplay({ recipe, onSave, onUpdate, isCreating, status = 'draft', onStatusChange }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedRecipe, setEditedRecipe] = useState(null)

  useEffect(() => {
    if (recipe) {
      setEditedRecipe(JSON.parse(JSON.stringify(recipe)))
      setIsEditing(false)
    } else if (isCreating) {
      setEditedRecipe(JSON.parse(JSON.stringify(BLANK_RECIPE)))
      setIsEditing(true)
    }
  }, [recipe, isCreating])

  const handleEditClick = () => {
    setIsEditing(true)
    if (onStatusChange) {
      onStatusChange('draft')
    }
  }

  if (!recipe && !isCreating) return null

  // Use editedRecipe for creating mode too
  if (!editedRecipe) return null

  const handleFieldChange = (field, value) => {
    setEditedRecipe(prev => ({ ...prev, [field]: value }))
  }

  const handleNutritionChange = (field, value) => {
    setEditedRecipe(prev => ({
      ...prev,
      nutritional_info: { ...prev.nutritional_info, [field]: parseFloat(value) || 0 }
    }))
  }

  const handleIngredientChange = (index, field, value) => {
    setEditedRecipe(prev => {
      const newIngredients = [...prev.ingredients]
      newIngredients[index] = { ...newIngredients[index], [field]: value }
      return { ...prev, ingredients: newIngredients }
    })
  }

  const addIngredient = () => {
    setEditedRecipe(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, { quantity: '', name: '' }]
    }))
  }

  const removeIngredient = (index) => {
    setEditedRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }))
  }

  const handleInstructionChange = (index, value) => {
    setEditedRecipe(prev => {
      const newInstructions = [...prev.instructions]
      newInstructions[index] = { ...newInstructions[index], description: value }
      return { ...prev, instructions: newInstructions }
    })
  }

  const addInstruction = () => {
    setEditedRecipe(prev => ({
      ...prev,
      instructions: [...prev.instructions, { step_number: prev.instructions.length + 1, description: '' }]
    }))
  }

  const removeInstruction = (index) => {
    setEditedRecipe(prev => ({
      ...prev,
      instructions: prev.instructions
        .filter((_, i) => i !== index)
        .map((inst, i) => ({ ...inst, step_number: i + 1 }))
    }))
  }

  const handleSaveEdits = () => {
    if (onUpdate) {
      onUpdate(editedRecipe)
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    if (recipe) {
      setEditedRecipe(JSON.parse(JSON.stringify(recipe)))
      setIsEditing(false)
    } else {
      // Reset to blank if creating new
      setEditedRecipe(JSON.parse(JSON.stringify(BLANK_RECIPE)))
    }
  }

  // For new recipe, always show editing view
  const isNewRecipe = isCreating && !recipe
  const showEditMode = isEditing || isNewRecipe
  const displayRecipe = showEditMode ? editedRecipe : recipe

  return (
    <div className="recipe-container">
      <div className={`recipe-status-tag ${status}`}>
        {status === 'draft' ? '📝 Draft' : '✓ Saved'}
      </div>
      <div className="recipe-header">
        {showEditMode ? (
          <input
            type="text"
            className="edit-input edit-title"
            value={editedRecipe.title}
            onChange={(e) => handleFieldChange('title', e.target.value)}
            placeholder="Recipe Title"
          />
        ) : (
          <h2>{displayRecipe.title}</h2>
        )}
        <div className="recipe-meta">
          {showEditMode ? (
            <>
              <select
                className="edit-select"
                value={editedRecipe.complexity}
                onChange={(e) => handleFieldChange('complexity', e.target.value)}
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              <input
                type="text"
                className="edit-input"
                value={editedRecipe.dietary_preferences}
                onChange={(e) => handleFieldChange('dietary_preferences', e.target.value)}
                placeholder="Dietary preferences (e.g., vegetarian, gluten-free)"
              />
            </>
          ) : (
            <>
              <span className="complexity">{displayRecipe.complexity}</span>
              <span className="dietary">{displayRecipe.dietary_preferences}</span>
            </>
          )}
          <div className="recipe-actions">
            {showEditMode ? (
              <>
                <button className="save-btn" onClick={handleSaveEdits}>✓ Done</button>
                {!isNewRecipe && <button className="cancel-btn" onClick={handleCancelEdit}>✕ Cancel</button>}
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

      {showEditMode ? (
        <textarea
          className="edit-textarea"
          value={editedRecipe.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          placeholder="Describe your recipe..."
          rows={3}
        />
      ) : (
        <p className="recipe-description">{displayRecipe.description}</p>
      )}

      {(displayRecipe.nutritional_info || showEditMode) && (
        <div className="recipe-section nutrition-section">
          <h3>Nutrition Information</h3>
          <p className="servings-info">
            Per serving (
            {showEditMode ? (
              <input
                type="number"
                className="edit-input-inline"
                value={editedRecipe.number_of_servings}
                onChange={(e) => handleFieldChange('number_of_servings', parseInt(e.target.value) || 1)}
                min="1"
              />
            ) : (
              displayRecipe.number_of_servings
            )} servings total)
          </p>
          <div className="nutrition-grid">
            <div className="nutrition-item">
              <span className="nutrition-label">Calories</span>
              {showEditMode ? (
                <input
                  type="number"
                  className="edit-input-nutrition"
                  value={editedRecipe.nutritional_info.calories}
                  onChange={(e) => handleNutritionChange('calories', e.target.value)}
                />
              ) : (
                <span className="nutrition-value">{displayRecipe.nutritional_info.calories} kcal</span>
              )}
            </div>
            <div className="nutrition-item">
              <span className="nutrition-label">Protein</span>
              {showEditMode ? (
                <input
                  type="number"
                  className="edit-input-nutrition"
                  value={editedRecipe.nutritional_info.protein}
                  onChange={(e) => handleNutritionChange('protein', e.target.value)}
                />
              ) : (
                <span className="nutrition-value">{displayRecipe.nutritional_info.protein}g</span>
              )}
            </div>
            <div className="nutrition-item">
              <span className="nutrition-label">Fat</span>
              {showEditMode ? (
                <input
                  type="number"
                  className="edit-input-nutrition"
                  value={editedRecipe.nutritional_info.fat}
                  onChange={(e) => handleNutritionChange('fat', e.target.value)}
                />
              ) : (
                <span className="nutrition-value">{displayRecipe.nutritional_info.fat}g</span>
              )}
            </div>
            <div className="nutrition-item">
              <span className="nutrition-label">Carbs</span>
              {showEditMode ? (
                <input
                  type="number"
                  className="edit-input-nutrition"
                  value={editedRecipe.nutritional_info.carbohydrates}
                  onChange={(e) => handleNutritionChange('carbohydrates', e.target.value)}
                />
              ) : (
                <span className="nutrition-value">{displayRecipe.nutritional_info.carbohydrates}g</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="recipe-section">
        <div className="section-header">
          <h3>Ingredients</h3>
          {showEditMode && (
            <button className="add-btn" onClick={addIngredient}>+ Add</button>
          )}
        </div>
        <ul className="ingredients-list">
          {displayRecipe.ingredients?.map((ingredient, index) => (
            <li key={index} className={showEditMode ? 'editing' : ''}>
              {showEditMode ? (
                <>
                  <input
                    type="text"
                    className="edit-input-qty"
                    value={editedRecipe.ingredients[index]?.quantity || ''}
                    onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                    placeholder="Qty"
                  />
                  <input
                    type="text"
                    className="edit-input-name"
                    value={editedRecipe.ingredients[index]?.name || ''}
                    onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                    placeholder="Ingredient name"
                  />
                  <button className="remove-btn" onClick={() => removeIngredient(index)}>×</button>
                </>
              ) : (
                <>
                  <strong>{ingredient.quantity}</strong> {ingredient.name}
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="recipe-section">
        <div className="section-header">
          <h3>Instructions</h3>
          {showEditMode && (
            <button className="add-btn" onClick={addInstruction}>+ Add</button>
          )}
        </div>
        <ol className="instructions-list">
          {displayRecipe.instructions?.map((instruction, index) => (
            <li key={instruction.step_number} className={showEditMode ? 'editing' : ''}>
              {showEditMode ? (
                <>
                  <textarea
                    className="edit-textarea-instruction"
                    value={editedRecipe.instructions[index]?.description || ''}
                    onChange={(e) => handleInstructionChange(index, e.target.value)}
                    placeholder="Describe this step..."
                    rows={2}
                  />
                  <button className="remove-btn" onClick={() => removeInstruction(index)}>×</button>
                </>
              ) : (
                instruction.description
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default RecipeDisplay
