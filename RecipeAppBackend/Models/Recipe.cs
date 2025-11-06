using System;
using System.Collections.Generic;

namespace RecipeAppBackend.Models
{
    public class Recipe
    {
        public string RecipeId { get; init; } = Guid.NewGuid().ToString();

        private string _recipeName;
        public string RecipeName
        {
            get => _recipeName;
            set
            {
                if (string.IsNullOrWhiteSpace(value) || value.Length < 3) throw new ArgumentException(nameof(value), "RecipeName must be at least 3 characters and cannot be null");
                _recipeName = value;
            }
        }

        private int _servings;
        public int Servings
        {
            get => _servings;
            set
            {
                ArgumentOutOfRangeException.ThrowIfNegativeOrZero(value, "Servings must be at least 1");
                _servings = value;
            }
        }

        public string Description { get; set; }
        public RecipeComplexity RecipeComplexity { get; set; }
        public List<RecipeIngredient> Ingredients { get; set; }
        public List<RecipeStep> RecipeSteps { get; set; }
        public RecipeNutrition NutritionInfo { get; set; }

        public Recipe(
            string recipeName,
            int recipeServings = 1,
            string recipeDescription = "",
            RecipeComplexity recipeComplexity = RecipeComplexity.Medium,
            RecipeNutrition recipeNutrition = null,
            List<RecipeIngredient> recipeIngredients = null,
            List<RecipeStep> recipeSteps = null)
        {
            RecipeName = recipeName;
            Servings = recipeServings;
            Description = recipeDescription;
            RecipeComplexity = recipeComplexity;
            NutritionInfo = recipeNutrition ?? new RecipeNutrition();
            Ingredients = recipeIngredients ?? new List<RecipeIngredient>();
            RecipeSteps = recipeSteps ?? new List<RecipeStep>();
        }

    }
}