import React from 'react'

function RecipeDisplay({ recipe, onSave, isCreating }) {
  if (!recipe && !isCreating) return null

  if (isCreating && !recipe) {
    return (
      <div className="recipe-container recipe-placeholder">
        <div className="recipe-placeholder-content">
          <div className="placeholder-icon">🍳</div>
          <h2>New Recipe</h2>
          <p>Use the chat to describe the recipe you'd like to create.</p>
          <p className="placeholder-hint">Try: "@recipe_agent make me a healthy breakfast with eggs"</p>
        </div>
      </div>
    )
  }

  return (
    <div className="recipe-container">
      <div className="recipe-header">
        <h2>{recipe.title}</h2>
        <div className="recipe-meta">
          <span className="complexity">{recipe.complexity}</span>
          <span className="dietary">{recipe.dietary_preferences}</span>
          <button className="save-btn" onClick={onSave}>💾 Save Recipe</button>
        </div>
      </div>

      <p className="recipe-description">{recipe.description}</p>

      {recipe.nutritional_info && (
        <div className="recipe-section nutrition-section">
          <h3>Nutrition Information</h3>
          <p className="servings-info">Per serving ({recipe.number_of_servings} servings total)</p>
          <div className="nutrition-grid">
            <div className="nutrition-item">
              <span className="nutrition-label">Calories</span>
              <span className="nutrition-value">{recipe.nutritional_info.calories} kcal</span>
            </div>
            <div className="nutrition-item">
              <span className="nutrition-label">Protein</span>
              <span className="nutrition-value">{recipe.nutritional_info.protein}g</span>
            </div>
            <div className="nutrition-item">
              <span className="nutrition-label">Fat</span>
              <span className="nutrition-value">{recipe.nutritional_info.fat}g</span>
            </div>
            <div className="nutrition-item">
              <span className="nutrition-label">Carbs</span>
              <span className="nutrition-value">{recipe.nutritional_info.carbohydrates}g</span>
            </div>
          </div>
        </div>
      )}

      <div className="recipe-section">
        <h3>Ingredients</h3>
        <ul className="ingredients-list">
          {recipe.ingredients?.map((ingredient, index) => (
            <li key={index}>
              <strong>{ingredient.quantity}</strong> {ingredient.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="recipe-section">
        <h3>Instructions</h3>
        <ol className="instructions-list">
          {recipe.instructions?.map((instruction) => (
            <li key={instruction.step_number}>
              {instruction.description}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default RecipeDisplay
