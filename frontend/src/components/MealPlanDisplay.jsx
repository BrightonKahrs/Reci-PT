import React from 'react'

function MealPlanDisplay({ recipePlan, onSave }) {
  return (
    <div className="recipe-plan-container">
      <div className="plan-header">
        <h2>📅 Your Weekly Meal Plan</h2>
        <div className="plan-header-right">
          <p className="plan-count">{recipePlan ? `${recipePlan.length} meals planned` : 'Plan your week'}</p>
          {recipePlan && (
            <button className="save-btn" onClick={onSave}>💾 Save Plan</button>
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
  )
}

export default MealPlanDisplay
