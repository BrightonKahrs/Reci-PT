import React from 'react'

function SavedRecipes({ savedRecipes = [], loading, onDelete, onView }) {
  return (
    <div className="saved-items-container">
      <div className="saved-items-header">
        <h2>📚 My Saved Recipes</h2>
        <span className="item-count">{savedRecipes?.length || 0} recipes</span>
      </div>
      
      {loading ? (
        <div className="loading">Loading saved recipes...</div>
      ) : !savedRecipes || savedRecipes.length === 0 ? (
        <p className="empty-message">No saved recipes yet. Generate and save a recipe to see it here!</p>
      ) : (
        <div className="saved-items-grid">
          {savedRecipes.map((item) => (
            <div key={item.key} className="saved-item-card">
              <div className="saved-item-header">
                <h4>{item.recipe.title}</h4>
                <button 
                  className="delete-btn" 
                  onClick={() => onDelete(item.key)}
                  title="Delete recipe"
                >
                  🗑️
                </button>
              </div>
              <p className="saved-item-description">{item.recipe.description}</p>
              <div className="saved-item-meta">
                <span className="complexity">{item.recipe.complexity}</span>
                <span className="servings">🍽️ {item.recipe.number_of_servings} servings</span>
              </div>
              <button 
                className="load-btn"
                onClick={() => onView(item.recipe)}
              >
                View Recipe
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SavedRecipes
