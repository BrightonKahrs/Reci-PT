import React from 'react'

function GroceryListDisplay({ groceryList, mealPlanTitle, onClose }) {
  if (!groceryList) return null

  const items = groceryList.items || []

  // Group items by unit for better organization
  const groupedItems = items.reduce((acc, item) => {
    const unit = item.unit || 'other'
    if (!acc[unit]) acc[unit] = []
    acc[unit].push(item)
    return acc
  }, {})

  const unitLabels = {
    grams: '⚖️ Dry Goods (grams)',
    ml: '🥛 Liquids (ml)',
    units: '🥚 Whole Items'
  }

  // Order of sections
  const unitOrder = ['units', 'grams', 'ml']

  return (
    <div className="recipe-container grocery-list-view">
      <div className="recipe-header">
        <h1>🛒 Grocery List</h1>
        {onClose && (
          <button className="close-btn" onClick={onClose}>✕</button>
        )}
      </div>

      <div className="recipe-meta">
        <span className="complexity grocery-source">
          📋 {mealPlanTitle || 'Meal Plan'}
        </span>
        <span className="dietary">{items.length} items</span>
      </div>

      {items.length === 0 ? (
        <div className="empty-grocery-list">
          <p>No ingredients in this grocery list.</p>
          <p className="empty-hint">Add recipes to your meal plan to generate a grocery list.</p>
        </div>
      ) : (
        <div className="grocery-sections">
          {unitOrder.map(unit => {
            const unitItems = groupedItems[unit]
            if (!unitItems || unitItems.length === 0) return null
            
            return (
              <div key={unit} className="recipe-section grocery-section">
                <h3>{unitLabels[unit] || unit}</h3>
                <ul className="grocery-items-list">
                  {unitItems.map((item, index) => (
                    <li key={index} className="grocery-item-row">
                      <input type="checkbox" className="grocery-checkbox" />
                      <span className="grocery-quantity">
                        {item.quantity}{item.unit !== 'units' ? ` ${item.unit}` : ''}
                      </span>
                      <span className="grocery-name">{item.name}</span>
                      {item.description && (
                        <span className="grocery-description">({item.description})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default GroceryListDisplay
