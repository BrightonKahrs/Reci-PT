import React, { useState, useEffect } from 'react'

const BLANK_GROCERY_LIST = {
  grocery_list_id: 'grocery_list:draft',
  title: '',
  meal_plan_id: '',
  items: []
}

function GroceryListDisplay({ groceryList, onSave, onUpdate, isCreating, status = 'draft', onStatusChange, onClose }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedList, setEditedList] = useState(null)

  useEffect(() => {
    if (isCreating) {
      setEditedList(groceryList ? JSON.parse(JSON.stringify(groceryList)) : JSON.parse(JSON.stringify(BLANK_GROCERY_LIST)))
      setIsEditing(true)
    } else if (groceryList) {
      setEditedList(JSON.parse(JSON.stringify(groceryList)))
      setIsEditing(false)
    }
  }, [groceryList, isCreating])

  if (!groceryList && !isCreating) return null
  if (!editedList) return null

  const handleEditClick = () => {
    setIsEditing(true)
    if (onStatusChange) {
      onStatusChange('draft')
    }
  }

  const handleSaveEdits = () => {
    if (onUpdate) {
      onUpdate(editedList)
    }
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    if (isCreating) {
      if (onClose) onClose()
    } else if (groceryList) {
      setEditedList(JSON.parse(JSON.stringify(groceryList)))
      setIsEditing(false)
    }
  }

  const handleTitleChange = (value) => {
    setEditedList(prev => ({ ...prev, title: value }))
  }

  const handleItemChange = (index, field, value) => {
    setEditedList(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      return { ...prev, items: newItems }
    })
  }

  const addItem = () => {
    setEditedList(prev => ({
      ...prev,
      items: [...prev.items, { name: '', quantity: 1, unit: 'units', description: '' }]
    }))
  }

  const removeItem = (index) => {
    setEditedList(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
  }

  const items = editedList.items || []

  // Group items by unit for display mode
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

  const unitOrder = ['units', 'grams', 'ml']
  const isNewList = isCreating && !groceryList?.grocery_list_id
  const showEditMode = isEditing || isNewList

  return (
    <div className="recipe-container grocery-list-view">
      {status && (
        <div className={`recipe-status-tag ${status}`}>
          {status === 'draft' ? '📝 Draft' : '✓ Saved'}
        </div>
      )}
      
      <div className="recipe-header">
        {showEditMode ? (
          <input
            type="text"
            className="edit-input edit-title"
            value={editedList.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Grocery List Title"
          />
        ) : (
          <h1>🛒 {editedList.title || 'Grocery List'}</h1>
        )}
      </div>

      <div className="recipe-meta">
        {editedList.meal_plan_id && (
          <span className="complexity grocery-source">
            📋 {editedList.meal_plan_id.replace('meal_plan:', '')}
          </span>
        )}
        <span className="dietary">{items.length} items</span>
        
        <div className="recipe-actions">
          {showEditMode ? (
            <>
              <button className="save-btn" onClick={() => { handleSaveEdits(); if (isNewList && onSave) onSave(editedList); }}>
                {isNewList ? '💾 Save' : '✓ Done'}
              </button>
              <button className="cancel-btn" onClick={handleCancelEdit}>✕ Cancel</button>
            </>
          ) : (
            <>
              <button className="edit-btn" onClick={handleEditClick}>✏️ Edit</button>
              {status === 'draft' && onSave && (
                <button className="save-btn" onClick={() => onSave()}>💾 Save</button>
              )}
              {onClose && <button className="close-btn" onClick={onClose}>✕</button>}
            </>
          )}
        </div>
      </div>

      {showEditMode ? (
        <div className="grocery-edit-section">
          <div className="section-header">
            <h3>Items</h3>
            <button className="add-btn" onClick={addItem}>+ Add Item</button>
          </div>
          
          <div className="grocery-edit-items">
            {items.map((item, index) => (
              <div key={index} className="grocery-edit-row">
                <input
                  type="number"
                  className="edit-input quantity-input"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                  min="0"
                  step="0.1"
                />
                <select
                  className="edit-select unit-select"
                  value={item.unit}
                  onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                >
                  <option value="units">units</option>
                  <option value="grams">grams</option>
                  <option value="ml">ml</option>
                </select>
                <input
                  type="text"
                  className="edit-input name-input"
                  value={item.name}
                  onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                  placeholder="Item name"
                />
                <input
                  type="text"
                  className="edit-input description-input"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="Description (optional)"
                />
                <button className="remove-btn" onClick={() => removeItem(index)}>🗑️</button>
              </div>
            ))}
            {items.length === 0 && (
              <p className="empty-hint">Click "+ Add Item" to add items to your grocery list.</p>
            )}
          </div>
        </div>
      ) : (
        <>
          {items.length === 0 ? (
            <div className="empty-grocery-list">
              <p>No items in this grocery list.</p>
              <p className="empty-hint">Click Edit to add items.</p>
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
        </>
      )}
    </div>
  )
}

export default GroceryListDisplay
