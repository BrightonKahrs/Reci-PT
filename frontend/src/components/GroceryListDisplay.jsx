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
    grams: 'Dry Goods (grams)',
    ml: 'Liquids (ml)',
    units: 'Whole Items'
  }

  return (
    <div className="grocery-list-container">
      <div className="grocery-list-header">
        <div className="grocery-list-title">
          <span className="grocery-icon">🛒</span>
          <h2>Grocery List</h2>
        </div>
        <div className="grocery-list-subtitle">
          For: {mealPlanTitle || 'Meal Plan'}
        </div>
        {onClose && (
          <button className="close-btn" onClick={onClose}>×</button>
        )}
      </div>

      <div className="grocery-list-stats">
        <span className="stat-badge">{items.length} items</span>
      </div>

      <div className="grocery-list-content">
        {Object.entries(groupedItems).map(([unit, unitItems]) => (
          <div key={unit} className="grocery-section">
            <h3 className="grocery-section-title">{unitLabels[unit] || unit}</h3>
            <ul className="grocery-items">
              {unitItems.map((item, index) => (
                <li key={index} className="grocery-item">
                  <span className="item-quantity">
                    {item.quantity} {item.unit === 'units' ? '' : item.unit}
                  </span>
                  <span className="item-name">{item.name}</span>
                  {item.description && (
                    <span className="item-description">({item.description})</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {items.length === 0 && (
          <div className="empty-grocery-list">
            <p>No ingredients in this grocery list.</p>
            <p className="empty-hint">Add recipes to your meal plan to generate a grocery list.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default GroceryListDisplay
