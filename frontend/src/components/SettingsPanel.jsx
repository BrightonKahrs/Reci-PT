import React from 'react'

function SettingsPanel({ 
  settings, 
  newRequiredPref, 
  setNewRequiredPref,
  newPreferredPref,
  setNewPreferredPref,
  onAddPreference,
  onRemovePreference,
  getRequiredPrefs,
  getPreferredPrefs
}) {
  return (
    <div className="settings-panel">
      <h3>⚙️ User Settings</h3>
      <p className="settings-description">
        Configure your dietary requirements and preferences. These will be applied to all generated recipes and meal plans.
      </p>
      
      <div className="preferences-grid">
        {/* Required Preferences */}
        <div className="preference-column required">
          <h4>🚫 Required (Must Follow)</h4>
          <p className="preference-help">Dietary restrictions that must always be followed</p>
          
          <div className="preference-tags">
            {getRequiredPrefs().map((pref, idx) => (
              <span key={idx} className="preference-tag required">
                {pref}
                <button 
                  className="remove-tag" 
                  onClick={() => onRemovePreference('Required', pref)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          
          <div className="add-preference">
            <input
              type="text"
              value={newRequiredPref}
              onChange={(e) => setNewRequiredPref(e.target.value)}
              placeholder="E.g., vegetarian, gluten-free, nut allergy..."
              className="preference-input"
              onKeyPress={(e) => e.key === 'Enter' && onAddPreference('Required')}
            />
            <button 
              className="add-btn"
              onClick={() => onAddPreference('Required')}
              disabled={!newRequiredPref.trim()}
            >
              + Add
            </button>
          </div>
        </div>

        {/* Preferred Preferences */}
        <div className="preference-column preferred">
          <h4>💚 Preferred (Nice to Have)</h4>
          <p className="preference-help">Preferences to consider when possible</p>
          
          <div className="preference-tags">
            {getPreferredPrefs().map((pref, idx) => (
              <span key={idx} className="preference-tag preferred">
                {pref}
                <button 
                  className="remove-tag" 
                  onClick={() => onRemovePreference('Preferred', pref)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          
          <div className="add-preference">
            <input
              type="text"
              value={newPreferredPref}
              onChange={(e) => setNewPreferredPref(e.target.value)}
              placeholder="E.g., low sodium, high protein, organic..."
              className="preference-input"
              onKeyPress={(e) => e.key === 'Enter' && onAddPreference('Preferred')}
            />
            <button 
              className="add-btn"
              onClick={() => onAddPreference('Preferred')}
              disabled={!newPreferredPref.trim()}
            >
              + Add
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
