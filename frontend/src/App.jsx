import { useState } from 'react'
import './App.css'

const API_BASE_URL = 'http://localhost:8000'

function App() {
  const [activeTab, setActiveTab] = useState('recipe')
  const [query, setQuery] = useState('')
  const [recipe, setRecipe] = useState(null)
  const [recipePlan, setRecipePlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!query.trim()) {
      setError('Please enter a recipe query')
      return
    }

    setLoading(true)
    setError(null)
    setRecipe(null)
    setRecipePlan(null)

    try {
      const endpoint = activeTab === 'recipe' ? '/generate-recipe' : '/generate-recipe-plan'
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to generate ${activeTab === 'recipe' ? 'recipe' : 'recipe plan'}`)
      }

      const data = await response.json()
      console.log('Received data:', data)
      
      if (activeTab === 'recipe') {
        // Recipe is now returned as an object, not a JSON string
        setRecipe(data.recipe)
      } else {
        console.log('Setting recipe plan:', data.recipe_plan)
        setRecipePlan(data.recipe_plan)
      }
    } catch (err) {
      setError(err.message || 'An error occurred while generating the recipe')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🍳 AI Recipe Generator</h1>
        <p>Generate custom recipes using AI</p>
      </header>

      <main className="main">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'recipe' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('recipe')
              setRecipe(null)
              setRecipePlan(null)
              setError(null)
            }}
          >
            Generate Recipe
          </button>
          <button 
            className={`tab ${activeTab === 'plan' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('plan')
              setRecipe(null)
              setRecipePlan(null)
              setError(null)
            }}
          >
            Generate Meal Plan
          </button>
        </div>

        <form onSubmit={handleSubmit} className="query-form">
          <div className="input-group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                activeTab === 'recipe' 
                  ? "E.g., 'vegetarian pasta with tomatoes' or 'quick breakfast ideas'"
                  : "E.g., 'healthy meal plan for weight loss' or 'vegetarian weekly menu'"
              }
              className="query-input"
              disabled={loading}
            />
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Generating...' : activeTab === 'recipe' ? 'Generate Recipe' : 'Generate Meal Plan'}
            </button>
          </div>
        </form>

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {recipe && (
          <div className="recipe-container">
            <div className="recipe-header">
              <h2>{recipe.title}</h2>
              <div className="recipe-meta">
                <span className="complexity">{recipe.complexity}</span>
                <span className="dietary">{recipe.dietary_preferences}</span>
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
        )}

        {activeTab === 'plan' && (
          <div className="recipe-plan-container">
            <div className="plan-header">
              <h2>📅 Your Weekly Meal Plan</h2>
              <p className="plan-count">{recipePlan ? `${recipePlan.length} meals planned` : 'Plan your week'}</p>
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
                    // Find matching plan for this day/meal combination
                    const plan = recipePlan?.find(p => 
                      p.meal_type === mealType && 
                      (Array.isArray(p.meal_day) ? p.meal_day.includes(day) : p.meal_day === day)
                    )
                    
                    return (
                      <div key={`${day}-${mealType}`} className={`meal-cell ${plan ? 'filled' : 'empty'}`}>
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
                          </>
                        ) : (
                          <div className="empty-placeholder">-</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
