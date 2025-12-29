import { useState, useEffect } from 'react'
import './App.css'

const API_BASE_URL = 'http://localhost:8000'

function App() {
  const [activeTab, setActiveTab] = useState('recipe')
  const [query, setQuery] = useState('')
  const [recipe, setRecipe] = useState(null)
  const [recipePlan, setRecipePlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // Settings state
  const [settings, setSettings] = useState({ user_settings: [] })
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsError, setSettingsError] = useState(null)
  const [newRequiredPref, setNewRequiredPref] = useState('')
  const [newPreferredPref, setNewPreferredPref] = useState('')

  // Saved items state
  const [savedRecipes, setSavedRecipes] = useState([])
  const [savedMealPlans, setSavedMealPlans] = useState([])
  const [savedItemsLoading, setSavedItemsLoading] = useState(false)

  // Load settings when Settings tab is active
  useEffect(() => {
    if (activeTab === 'settings') {
      loadSettings()
    }
  }, [activeTab])

  // Load saved recipes and meal plans on mount and when switching to recipe/plan tabs
  useEffect(() => {
    loadSavedItems()
  }, [])

  const loadSavedItems = async () => {
    setSavedItemsLoading(true)
    try {
      const [recipesRes, mealPlansRes] = await Promise.all([
        fetch(`${API_BASE_URL}/recipe/`),
        fetch(`${API_BASE_URL}/meal-plan/`)
      ])
      
      if (recipesRes.ok) {
        const recipesData = await recipesRes.json()
        setSavedRecipes(recipesData.recipes || [])
      }
      
      if (mealPlansRes.ok) {
        const mealPlansData = await mealPlansRes.json()
        setSavedMealPlans(mealPlansData.meal_plans || [])
      }
    } catch (err) {
      console.error('Failed to load saved items:', err)
    } finally {
      setSavedItemsLoading(false)
    }
  }

  const deleteRecipe = async (key) => {
    try {
      const response = await fetch(`${API_BASE_URL}/recipe/${key}`, { method: 'DELETE' })
      if (response.ok) {
        setSavedRecipes(savedRecipes.filter(r => r.key !== key))
      }
    } catch (err) {
      console.error('Failed to delete recipe:', err)
    }
  }

  const deleteMealPlan = async (key) => {
    try {
      const response = await fetch(`${API_BASE_URL}/meal-plan/${key}`, { method: 'DELETE' })
      if (response.ok) {
        setSavedMealPlans(savedMealPlans.filter(m => m.key !== key))
      }
    } catch (err) {
      console.error('Failed to delete meal plan:', err)
    }
  }

  const saveCurrentRecipe = async () => {
    if (!recipe) return
    try {
      const response = await fetch(`${API_BASE_URL}/recipe/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe })
      })
      if (response.ok) {
        loadSavedItems()
      }
    } catch (err) {
      console.error('Failed to save recipe:', err)
    }
  }

  const saveCurrentMealPlan = async () => {
    if (!recipePlan) return
    try {
      const response = await fetch(`${API_BASE_URL}/meal-plan/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe_plan: recipePlan })
      })
      if (response.ok) {
        loadSavedItems()
      }
    } catch (err) {
      console.error('Failed to save meal plan:', err)
    }
  }

  const loadSettings = async () => {
    setSettingsLoading(true)
    setSettingsError(null)
    try {
      const response = await fetch(`${API_BASE_URL}/user-settings/`)
      if (response.status === 404) {
        // No settings found, start with empty
        setSettings({ user_settings: [] })
        return
      }
      if (!response.ok) {
        throw new Error('Failed to load settings')
      }
      const data = await response.json()
      setSettings(data)
    } catch (err) {
      if (!err.message.includes('404')) {
        setSettingsError(err.message)
      }
      setSettings({ user_settings: [] })
    } finally {
      setSettingsLoading(false)
    }
  }

  const saveSettings = async (newSettings) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user-settings/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })
      if (!response.ok) {
        throw new Error('Failed to save settings')
      }
      setSettings(newSettings)
      setSettingsError(null)
    } catch (err) {
      setSettingsError(err.message)
    }
  }

  const addPreference = async (importance) => {
    const newPref = importance === 'Required' ? newRequiredPref : newPreferredPref
    if (!newPref.trim()) return

    const newSetting = {
      dietary_preference: newPref.trim(),
      order_of_importance: importance,
      generated_by: 'user'
    }

    const newSettings = {
      user_settings: [...settings.user_settings, newSetting]
    }

    await saveSettings(newSettings)
    
    if (importance === 'Required') {
      setNewRequiredPref('')
    } else {
      setNewPreferredPref('')
    }
  }

  const removePreference = async (index) => {
    const newSettings = {
      user_settings: settings.user_settings.filter((_, i) => i !== index)
    }
    await saveSettings(newSettings)
  }

  const getRequiredPrefs = () => settings.user_settings.filter(s => s.order_of_importance === 'Required')
  const getPreferredPrefs = () => settings.user_settings.filter(s => s.order_of_importance === 'Preferred')

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!query.trim()) {
      setError('Please enter a recipe query')
      return
    }

    setLoading(true)
    setError(null)
    // Don't clear recipe/recipePlan here - keep showing old data until new data arrives

    try {
      const endpoint = activeTab === 'recipe' ? '/ai/generate-recipe' : '/ai/generate-meal-plan'
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to generate ${activeTab === 'recipe' ? 'recipe' : 'meal plan'}`)
      }

      const data = await response.json()
      console.log('Received data:', data)
      
      if (activeTab === 'recipe') {
        // Recipe is now returned as an object, not a JSON string
        setRecipe(data.recipe)
      } else {
        // Meal plan response has recipe_plan array
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
              setError(null)
            }}
          >
            Generate Recipe
          </button>
          <button 
            className={`tab ${activeTab === 'plan' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('plan')
              setError(null)
            }}
          >
            Generate Meal Plan
          </button>
          <button 
            className={`tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('settings')
              setError(null)
            }}
          >
            ⚙️ Settings
          </button>
        </div>

        {activeTab !== 'settings' && (
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
        )}

        {activeTab === 'settings' && (
          <div className="settings-container">
            <h2>🍽️ Dietary Preferences</h2>
            <p className="settings-description">
              Configure your dietary preferences. Required restrictions will always be enforced, 
              while preferred options will be considered when possible.
            </p>

            {settingsError && (
              <div className="error-message">⚠️ {settingsError}</div>
            )}

            {settingsLoading ? (
              <div className="loading">Loading settings...</div>
            ) : (
              <div className="settings-sections">
                {/* Required Section */}
                <div className="settings-section required-section">
                  <div className="section-header">
                    <h3>🚫 Required Restrictions</h3>
                    <span className="section-badge required">Must follow</span>
                  </div>
                  <p className="section-description">
                    These dietary restrictions will always be strictly enforced.
                  </p>
                  
                  <div className="preferences-list">
                    {getRequiredPrefs().map((pref, index) => {
                      const globalIndex = settings.user_settings.findIndex(
                        s => s === pref
                      )
                      return (
                        <div key={index} className="preference-item">
                          <span className="preference-text">{pref.dietary_preference}</span>
                          <button 
                            className="delete-btn"
                            onClick={() => removePreference(globalIndex)}
                            title="Remove preference"
                          >
                            🗑️
                          </button>
                        </div>
                      )
                    })}
                    {getRequiredPrefs().length === 0 && (
                      <p className="empty-message">No required restrictions set</p>
                    )}
                  </div>

                  <div className="add-preference">
                    <input
                      type="text"
                      value={newRequiredPref}
                      onChange={(e) => setNewRequiredPref(e.target.value)}
                      placeholder="E.g., vegetarian, gluten-free, no nuts..."
                      className="preference-input"
                      onKeyPress={(e) => e.key === 'Enter' && addPreference('Required')}
                    />
                    <button 
                      className="add-btn"
                      onClick={() => addPreference('Required')}
                      disabled={!newRequiredPref.trim()}
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Preferred Section */}
                <div className="settings-section preferred-section">
                  <div className="section-header">
                    <h3>💚 Preferred Options</h3>
                    <span className="section-badge preferred">Nice to have</span>
                  </div>
                  <p className="section-description">
                    These preferences will be considered when generating recipes.
                  </p>
                  
                  <div className="preferences-list">
                    {getPreferredPrefs().map((pref, index) => {
                      const globalIndex = settings.user_settings.findIndex(
                        s => s === pref
                      )
                      return (
                        <div key={index} className="preference-item">
                          <span className="preference-text">{pref.dietary_preference}</span>
                          <button 
                            className="delete-btn"
                            onClick={() => removePreference(globalIndex)}
                            title="Remove preference"
                          >
                            🗑️
                          </button>
                        </div>
                      )
                    })}
                    {getPreferredPrefs().length === 0 && (
                      <p className="empty-message">No preferred options set</p>
                    )}
                  </div>

                  <div className="add-preference">
                    <input
                      type="text"
                      value={newPreferredPref}
                      onChange={(e) => setNewPreferredPref(e.target.value)}
                      placeholder="E.g., low sodium, high protein, organic..."
                      className="preference-input"
                      onKeyPress={(e) => e.key === 'Enter' && addPreference('Preferred')}
                    />
                    <button 
                      className="add-btn"
                      onClick={() => addPreference('Preferred')}
                      disabled={!newPreferredPref.trim()}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}

        {activeTab === 'recipe' && recipe && (
          <div className="recipe-container">
            <div className="recipe-header">
              <h2>{recipe.title}</h2>
              <div className="recipe-meta">
                <span className="complexity">{recipe.complexity}</span>
                <span className="dietary">{recipe.dietary_preferences}</span>
                <button className="save-btn" onClick={saveCurrentRecipe}>💾 Save Recipe</button>
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

        {/* My Saved Recipes Section */}
        {activeTab === 'recipe' && (
          <div className="saved-items-container">
            <div className="saved-items-header">
              <h2>📚 My Saved Recipes</h2>
              <span className="item-count">{savedRecipes.length} recipes</span>
            </div>
            
            {savedItemsLoading ? (
              <div className="loading">Loading saved recipes...</div>
            ) : savedRecipes.length === 0 ? (
              <p className="empty-message">No saved recipes yet. Generate and save a recipe to see it here!</p>
            ) : (
              <div className="saved-items-grid">
                {savedRecipes.map((item) => (
                  <div key={item.key} className="saved-item-card">
                    <div className="saved-item-header">
                      <h4>{item.recipe.title}</h4>
                      <button 
                        className="delete-btn" 
                        onClick={() => deleteRecipe(item.key)}
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
                      onClick={() => setRecipe(item.recipe)}
                    >
                      View Recipe
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'plan' && (
          <div className="recipe-plan-container">
            <div className="plan-header">
              <h2>📅 Your Weekly Meal Plan</h2>
              <div className="plan-header-right">
                <p className="plan-count">{recipePlan ? `${recipePlan.length} meals planned` : 'Plan your week'}</p>
                {recipePlan && (
                  <button className="save-btn" onClick={saveCurrentMealPlan}>💾 Save Plan</button>
                )}
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

        {/* My Saved Meal Plans Section */}
        {activeTab === 'plan' && (
          <div className="saved-items-container">
            <div className="saved-items-header">
              <h2>📋 My Saved Meal Plans</h2>
              <span className="item-count">{savedMealPlans.length} plans</span>
            </div>
            
            {savedItemsLoading ? (
              <div className="loading">Loading saved meal plans...</div>
            ) : savedMealPlans.length === 0 ? (
              <p className="empty-message">No saved meal plans yet. Generate and save a meal plan to see it here!</p>
            ) : (
              <div className="saved-items-grid">
                {savedMealPlans.map((item) => (
                  <div key={item.key} className="saved-item-card meal-plan-card">
                    <div className="saved-item-header">
                      <h4>Meal Plan</h4>
                      <button 
                        className="delete-btn" 
                        onClick={() => deleteMealPlan(item.key)}
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
                      onClick={() => setRecipePlan(item.meal_plan.recipe_plan)}
                    >
                      View Plan
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
