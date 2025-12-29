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
  const [recipe, setRecipe] = useState(null)
  const [mealPlan, setMealPlan] = useState(null) // { meal_plan_title, recipe_plan }
  const [leftTab, setLeftTab] = useState('recipe') // 'recipe' or 'plan'
  const [rightTab, setRightTab] = useState('chat') // 'chat' or 'settings'
  const [isCreatingRecipe, setIsCreatingRecipe] = useState(false)
  const [isCreatingMealPlan, setIsCreatingMealPlan] = useState(false)
  const [chatInputValue, setChatInputValue] = useState('')
  const [recipeStatus, setRecipeStatus] = useState('draft') // 'draft' or 'saved'
  const [mealPlanStatus, setMealPlanStatus] = useState('draft') // 'draft' or 'saved'
  
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
      const response = await fetch(`${API_BASE_URL}/recipe/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe: recipe })
      })
      if (response.ok) {
        setRecipeStatus('saved')
        loadSavedItems()
      }
    } catch (err) {
      console.error('Failed to save recipe:', err)
    }
  }

  const saveCurrentMealPlan = async () => {
    if (!mealPlan) return
    try {
      const response = await fetch(`${API_BASE_URL}/meal-plan/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mealPlan)
      })
      if (response.ok) {
        setMealPlanStatus('saved')
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
            {leftTab === 'recipe' && (
              <>
                <RecipeDisplay 
                  recipe={recipe} 
                  onSave={saveCurrentRecipe} 
                  onUpdate={setRecipe}
                  isCreating={isCreatingRecipe}
                  status={recipeStatus}
                  onStatusChange={setRecipeStatus}
                  onCancel={() => {
                    setRecipe(null)
                    setIsCreatingRecipe(false)
                  }}
                />
                <SavedRecipes 
                  savedRecipes={savedRecipes}
                  loading={savedItemsLoading}
                  onDelete={deleteRecipe}
                  onView={(r) => {
                    setRecipe(r)
                    setIsCreatingRecipe(false)
                    setRecipeStatus('saved')
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
                <MealPlanDisplay 
                  mealPlan={mealPlan} 
                  onSave={saveCurrentMealPlan}
                  onUpdate={(updatedMealPlan) => {
                    setMealPlan(updatedMealPlan)
                    setMealPlanStatus('draft')
                  }}
                  isCreating={isCreatingMealPlan}
                  status={mealPlanStatus}
                  onStatusChange={setMealPlanStatus}
                  onCancel={() => {
                    setMealPlan(null)
                    setIsCreatingMealPlan(false)
                  }}
                  savedRecipes={savedRecipes}
                />
                <SavedMealPlans 
                  savedMealPlans={savedMealPlans}
                  loading={savedItemsLoading}
                  onDelete={deleteMealPlan}
                  onView={(savedMealPlan) => {
                    setMealPlan(savedMealPlan)
                    setIsCreatingMealPlan(false)
                    setMealPlanStatus('saved')
                  }}
                  onCreateNew={() => {
                    setMealPlan({ meal_plan_title: '', recipe_plan: [] })
                    setIsCreatingMealPlan(true)
                    setMealPlanStatus('draft')
                  }}
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
                  setRecipeStatus('draft')
                  setLeftTab('recipe')
                }}
                onMealPlanGenerated={(generatedMealPlan) => {
                  // generatedMealPlan from API is just the recipe_plan array
                  setMealPlan({ 
                    meal_plan_title: 'Generated Meal Plan', 
                    recipe_plan: generatedMealPlan 
                  })
                  setIsCreatingMealPlan(false)
                  setMealPlanStatus('draft')
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
