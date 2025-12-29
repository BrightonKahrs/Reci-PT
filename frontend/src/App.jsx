import { useState, useEffect } from 'react'
import './App.css'
import { 
  RecipeDisplay, 
  MealPlanDisplay, 
  SavedRecipes, 
  SavedMealPlans,
  SettingsPanel,
  ChatPanel 
} from './components'

const API_BASE_URL = 'http://localhost:8000'

function App() {
  const [query, setQuery] = useState('')
  const [recipe, setRecipe] = useState(null)
  const [recipePlan, setRecipePlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [leftTab, setLeftTab] = useState('recipe') // 'recipe' or 'plan'
  const [rightTab, setRightTab] = useState('chat') // 'chat' or 'settings'
  const [isCreatingRecipe, setIsCreatingRecipe] = useState(false)
  const [chatInputValue, setChatInputValue] = useState('')
  
  // Settings state
  const [settings, setSettings] = useState(null)
  const [newRequiredPref, setNewRequiredPref] = useState('')
  const [newPreferredPref, setNewPreferredPref] = useState('')
  
  // Saved items state
  const [savedRecipes, setSavedRecipes] = useState([])
  const [savedMealPlans, setSavedMealPlans] = useState([])
  const [savedItemsLoading, setSavedItemsLoading] = useState(false)

  // Load settings and saved items on mount
  useEffect(() => {
    loadSavedItems()
    loadSettings()
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
        loadSavedItems()
      }
    } catch (err) {
      console.error('Failed to delete recipe:', err)
    }
  }

  const deleteMealPlan = async (key) => {
    try {
      const response = await fetch(`${API_BASE_URL}/meal-plan/${key}`, { method: 'DELETE' })
      if (response.ok) {
        loadSavedItems()
      }
    } catch (err) {
      console.error('Failed to delete meal plan:', err)
    }
  }

  const saveCurrentRecipe = async () => {
    if (!recipe) return
    try {
      const response = await fetch(`${API_BASE_URL}/recipe/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recipe)
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
      const response = await fetch(`${API_BASE_URL}/meal-plan/`, {
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
    try {
      const response = await fetch(`${API_BASE_URL}/user-settings/`)
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      } else {
        // Initialize with empty structure if no settings exist
        setSettings({ user_settings: [] })
      }
    } catch (err) {
      console.error('Error loading settings:', err)
      setSettings({ user_settings: [] })
    }
  }

  const saveSettings = async (newSettings) => {
    try {
      const response = await fetch(`${API_BASE_URL}/user-settings/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      })
      if (response.ok) {
        setSettings(newSettings)
      }
    } catch (err) {
      console.error('Error saving settings:', err)
    }
  }

  const addPreference = (type) => {
    const newPref = type === 'Required' ? newRequiredPref.trim() : newPreferredPref.trim()
    if (!newPref || !settings) return

    const currentPrefs = settings.user_settings || []
    const newPrefs = [...currentPrefs, { dietary_preference: newPref, order_of_importance: type, generated_by: 'user' }]
    
    const newSettings = { ...settings, user_settings: newPrefs }
    saveSettings(newSettings)
    
    if (type === 'Required') {
      setNewRequiredPref('')
    } else {
      setNewPreferredPref('')
    }
  }

  const removePreference = (type, prefText) => {
    if (!settings) return
    
    const newPrefs = (settings.user_settings || []).filter(
      p => !(p.dietary_preference === prefText && p.order_of_importance === type)
    )
    
    const newSettings = { ...settings, user_settings: newPrefs }
    saveSettings(newSettings)
  }

  const getRequiredPrefs = () => {
    return (settings?.user_settings || [])
      .filter(p => p.order_of_importance === 'Required')
      .map(p => p.dietary_preference)
  }

  const getPreferredPrefs = () => {
    return (settings?.user_settings || [])
      .filter(p => p.order_of_importance === 'Preferred')
      .map(p => p.dietary_preference)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!query.trim()) return
    
    setLoading(true)
    setError(null)

    try {
      const endpoint = leftTab === 'recipe' 
        ? 'http://localhost:8000/ai/generate-recipe'
        : 'http://localhost:8000/ai/generate-meal-plan'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate')
      }
      
      const data = await response.json()
      
      if (leftTab === 'recipe') {
        setRecipe(data.recipe)
      } else {
        setRecipePlan(data.recipe_plan)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🍳 Reci-PT</h1>
        <p>Your AI-Powered Recipe & Meal Planning Assistant</p>
      </header>

      <div className="panel-container">
        {/* Left Panel - 2/3 width */}
        <div className="left-panel">
          <div className="panel-tabs">
            <button 
              className={`panel-tab ${leftTab === 'recipe' ? 'active' : ''}`}
              onClick={() => setLeftTab('recipe')}
            >
              🍲 Generate Recipe
            </button>
            <button 
              className={`panel-tab ${leftTab === 'plan' ? 'active' : ''}`}
              onClick={() => setLeftTab('plan')}
            >
              📅 Generate Meal Plan
            </button>
          </div>

          <div className="panel-content">
            <form onSubmit={handleSubmit} className="query-form">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={leftTab === 'recipe' 
                  ? "What recipe would you like? E.g., 'Healthy pasta with vegetables'" 
                  : "What kind of meal plan? E.g., 'Healthy week with quick dinners'"
                }
                className="query-input"
              />
              <button type="submit" disabled={loading} className="generate-btn">
                {loading ? 'Generating...' : `Generate ${leftTab === 'recipe' ? 'Recipe' : 'Meal Plan'}`}
              </button>
            </form>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            {leftTab === 'recipe' && (
              <>
                <RecipeDisplay 
                  recipe={recipe} 
                  onSave={saveCurrentRecipe} 
                  isCreating={isCreatingRecipe}
                />
                <SavedRecipes 
                  savedRecipes={savedRecipes}
                  loading={savedItemsLoading}
                  onDelete={deleteRecipe}
                  onView={(r) => {
                    setRecipe(r)
                    setIsCreatingRecipe(false)
                  }}
                  onCreateNew={() => {
                    setRecipe(null)
                    setIsCreatingRecipe(true)
                    setChatInputValue('@recipe_agent ')
                    setRightTab('chat')
                  }}
                />
              </>
            )}

            {leftTab === 'plan' && (
              <>
                <MealPlanDisplay recipePlan={recipePlan} onSave={saveCurrentMealPlan} />
                <SavedMealPlans 
                  savedMealPlans={savedMealPlans}
                  loading={savedItemsLoading}
                  onDelete={deleteMealPlan}
                  onView={setRecipePlan}
                />
              </>
            )}
          </div>
        </div>

        {/* Right Panel - 1/3 width */}
        <div className="right-panel">
          <div className="panel-tabs">
            <button 
              className={`panel-tab ${rightTab === 'chat' ? 'active' : ''}`}
              onClick={() => setRightTab('chat')}
            >
              💬 Chat
            </button>
            <button 
              className={`panel-tab ${rightTab === 'settings' ? 'active' : ''}`}
              onClick={() => setRightTab('settings')}
            >
              ⚙️ Settings
            </button>
          </div>

          <div className="panel-content">
            {rightTab === 'chat' && (
              <ChatPanel 
                inputValue={chatInputValue}
                onInputChange={setChatInputValue}
                onRecipeGenerated={(recipe) => {
                  setRecipe(recipe)
                  setIsCreatingRecipe(false)
                  setLeftTab('recipe')
                }}
                onMealPlanGenerated={(mealPlan) => {
                  setRecipePlan(mealPlan)
                  setLeftTab('plan')
                }}
              />
            )}

            {rightTab === 'settings' && (
              <SettingsPanel 
                settings={settings}
                newRequiredPref={newRequiredPref}
                setNewRequiredPref={setNewRequiredPref}
                newPreferredPref={newPreferredPref}
                setNewPreferredPref={setNewPreferredPref}
                onAddPreference={addPreference}
                onRemovePreference={removePreference}
                getRequiredPrefs={getRequiredPrefs}
                getPreferredPrefs={getPreferredPrefs}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
