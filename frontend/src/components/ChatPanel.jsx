import React, { useState, useEffect, useRef } from 'react'

const AGENT_MENTIONS = [
  { id: 'recipe_agent', label: '@recipe_agent', description: 'Generate a recipe' },
  { id: 'mealplan_agent', label: '@mealplan_agent', description: 'Create a meal plan' },
]

// Helper function to render message content with highlighted agent mentions
const renderMessageContent = (content) => {
  const agentPattern = /@(recipe_agent|mealplan_agent|meal_plan_agent)/gi
  const parts = content.split(agentPattern)
  
  if (parts.length === 1) {
    return content
  }
  
  return parts.map((part, index) => {
    if (part.toLowerCase() === 'recipe_agent') {
      return <span key={index} className="agent-mention recipe">@recipe_agent</span>
    } else if (part.toLowerCase() === 'mealplan_agent' || part.toLowerCase() === 'meal_plan_agent') {
      return <span key={index} className="agent-mention mealplan">@mealplan_agent</span>
    }
    return part
  })
}

function ChatPanel({ inputValue = '', onInputChange, onRecipeGenerated, onMealPlanGenerated }) {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Hi! I\'m your AI cooking assistant. Ask me anything about recipes, cooking techniques, ingredient substitutions, or meal planning! Use @recipe_agent to create recipes or @mealplan_agent for meal plans.' }
  ])
  const [inputMessage, setInputMessage] = useState(inputValue)
  const [isLoading, setIsLoading] = useState(false)
  const [showMentions, setShowMentions] = useState(false)
  const [mentionFilter, setMentionFilter] = useState('')
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0)
  const textareaRef = useRef(null)

  // Sync with external input value
  useEffect(() => {
    if (inputValue !== inputMessage) {
      setInputMessage(inputValue)
    }
  }, [inputValue])

  const handleInputChange = (e) => {
    const value = e.target.value
    setInputMessage(value)
    if (onInputChange) {
      onInputChange(value)
    }

    // Check for @ mention trigger
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = value.slice(0, cursorPos)
    const atMatch = textBeforeCursor.match(/@(\w*)$/)
    
    if (atMatch) {
      setShowMentions(true)
      setMentionFilter(atMatch[1].toLowerCase())
      setSelectedMentionIndex(0)
    } else {
      setShowMentions(false)
      setMentionFilter('')
    }
  }

  const filteredMentions = AGENT_MENTIONS.filter(m => 
    m.id.toLowerCase().includes(mentionFilter)
  )

  const insertMention = (mention) => {
    const cursorPos = textareaRef.current?.selectionStart || inputMessage.length
    const textBeforeCursor = inputMessage.slice(0, cursorPos)
    const textAfterCursor = inputMessage.slice(cursorPos)
    
    // Find where the @ starts
    const atIndex = textBeforeCursor.lastIndexOf('@')
    const newText = textBeforeCursor.slice(0, atIndex) + mention.label + ' ' + textAfterCursor
    
    setInputMessage(newText)
    if (onInputChange) {
      onInputChange(newText)
    }
    setShowMentions(false)
    setMentionFilter('')
    
    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
  }

  const handleKeyDown = (e) => {
    if (showMentions && filteredMentions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedMentionIndex(prev => 
          prev < filteredMentions.length - 1 ? prev + 1 : 0
        )
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : filteredMentions.length - 1
        )
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(filteredMentions[selectedMentionIndex])
      } else if (e.key === 'Escape') {
        setShowMentions(false)
      }
    }
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const rawMessage = inputMessage.trim()
    const hasRecipeAgent = rawMessage.includes('@recipe_agent')
    const hasMealPlanAgent = rawMessage.includes('@mealplan_agent')
    
    // Strip @mentions from the message for the API
    const cleanedMessage = rawMessage
      .replace(/@recipe_agent/g, '')
      .replace(/@mealplan_agent/g, '')
      .trim()

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: rawMessage
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    if (onInputChange) {
      onInputChange('')
    }
    setIsLoading(true)

    try {
      let endpoint = 'http://localhost:8000/ai/chat'
      let body = { message: cleanedMessage }
      
      if (hasRecipeAgent) {
        endpoint = 'http://localhost:8000/ai/generate-recipe'
        body = { query: cleanedMessage }
      } else if (hasMealPlanAgent) {
        endpoint = 'http://localhost:8000/ai/generate-meal-plan'
        body = { query: cleanedMessage }
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      let assistantContent = ''
      
      if (hasRecipeAgent && data.recipe) {
        // Recipe was generated - notify parent and show confirmation
        if (onRecipeGenerated) {
          onRecipeGenerated(data.recipe)
        }
        assistantContent = `✅ Created recipe: **${data.recipe.title}**\n\nI've displayed it in the left panel. Would you like me to modify anything?`
      } else if (hasMealPlanAgent && (data.recipe_plan || data.meal_plan_title)) {
        // Meal plan was generated - notify parent with full MealPlan object
        if (onMealPlanGenerated) {
          onMealPlanGenerated(data)
        }
        assistantContent = `✅ Created your meal plan!\n\nI've displayed it in the left panel. Would you like to make any changes?`
      } else {
        // Regular chat response
        assistantContent = data.response || data.message || 'I apologize, but I couldn\'t process your request.'
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: assistantContent
      }
      
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: '⚠️ Sorry, I encountered an error. Please try again.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (showMentions) return // Let handleKeyDown handle it
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Detect which agent is active
  const hasRecipeAgent = inputMessage.includes('@recipe_agent')
  const hasMealPlanAgent = inputMessage.includes('@mealplan_agent')
  const agentClass = hasRecipeAgent ? 'agent-recipe' : hasMealPlanAgent ? 'agent-mealplan' : ''

  return (
    <div className="chat-panel">
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'assistant' ? '🤖' : '👤'}
            </div>
            <div className="message-content">
              {renderMessageContent(msg.content)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="chat-message assistant">
            <div className="message-avatar">🤖</div>
            <div className="message-content typing">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
      </div>
      
      <div className="chat-input-container">
        {showMentions && filteredMentions.length > 0 && (
          <div className="mention-popup">
            {filteredMentions.map((mention, index) => (
              <div 
                key={mention.id}
                className={`mention-item ${index === selectedMentionIndex ? 'selected' : ''}`}
                onClick={() => insertMention(mention)}
              >
                <span className="mention-label">{mention.label}</span>
                <span className="mention-description">{mention.description}</span>
              </div>
            ))}
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onKeyPress={handleKeyPress}
          placeholder="Ask me about cooking, recipes, or ingredients... (type @ to mention an agent)"
          className={`chat-input ${agentClass}`}
          rows={2}
          disabled={isLoading}
        />
        <button 
          className="chat-send-btn"
          onClick={sendMessage}
          disabled={!inputMessage.trim() || isLoading}
        >
          Send
        </button>
      </div>
    </div>
  )
}

export default ChatPanel
