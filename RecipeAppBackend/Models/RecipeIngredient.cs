using System;
using System.Collections.Generic;

namespace RecipeAppBackend.Models
{
    public class RecipeIngredient
    {
        public string IngredientName { get; set; }
        public string IngredientAmount { get; set; }

        public RecipeIngredient(string ingredientName, string ingredientAmount = "")
        {
            IngredientName = ingredientName;
            IngredientAmount = ingredientAmount;
        }
    }
}