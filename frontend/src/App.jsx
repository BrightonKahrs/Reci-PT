import { useState } from 'react'
import './App.css'

const API_BASE_URL = 'http://localhost:8000'

function App() {
  const [query, setQuery] = useState('')
  const [recipe, setRecipe] = useState(null)
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

    try {
      const response = await fetch(`${API_BASE_URL}/generate-recipe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate recipe')
      }

      const data = await response.json()
      const parsedRecipe = JSON.parse(data.recipe_json)
      setRecipe(parsedRecipe)
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
        <form onSubmit={handleSubmit} className="query-form">
          <div className="input-group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="E.g., 'vegetarian pasta with tomatoes' or 'quick breakfast ideas'"
              className="query-input"
              disabled={loading}
            />
            <button type="submit" className="submit-button" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Recipe'}
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
      </main>
    </div>
  )
}

export default App
