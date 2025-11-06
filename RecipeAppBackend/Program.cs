using RecipeAppBackend.Models;
using System.Collections.Generic;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

var recipes = new List<Recipe>();

    var recipe = new Recipe("Spaghetti Bolognese", 4, "A classic Italian pasta dish.", RecipeComplexity.Medium);
    recipe.Ingredients.Add(new RecipeIngredient("Spaghetti", "400g"));
    recipe.Ingredients.Add(new RecipeIngredient("Ground Beef", "250g"));
    recipe.Ingredients.Add(new RecipeIngredient("Tomato Sauce", "1 cup"));

    recipe.RecipeSteps.Add(new RecipeStep("Boil the spaghetti according to package instructions.", stepTotalTime: 10, stepHandsOnTime: 2));
    recipe.RecipeSteps.Add(new RecipeStep("Cook the ground beef until browned.", stepTotalTime: 15, stepHandsOnTime: 5));

    recipe.NutritionInfo.Calories = 600;
    recipe.NutritionInfo.Carbs = 75;

recipes.Add(recipe);

app.MapGet("/", () => $"Recipe: {recipe.RecipeName}");

app.MapGet("/api/recipes", () =>
{
    return $"You have {recipes.Count}. First ID is {recipes[0].RecipeId}";
});

app.MapGet("/api/recipes/{recipeId}", (string recipeId) => {
    var foundRecipe = recipes.FirstOrDefault(r => r.RecipeId == recipeId);

    if (foundRecipe == null)
    {
        return "Recipe not found";
    }

    return $"You are looking at the {foundRecipe.RecipeId}";
});

app.Run();