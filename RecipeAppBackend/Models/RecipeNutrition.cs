namespace RecipeAppBackend.Models
{
    public class RecipeNutrition
    {
        private int _calories; 
        public int Calories
        {
            get => _calories;
            set
            {
                ArgumentOutOfRangeException.ThrowIfNegative(value);
                _calories = value;
            }
        }

        private int _carbs;
        public int Carbs
        {
            get => _carbs;
            set
            {
                ArgumentOutOfRangeException.ThrowIfNegative(value);
                _carbs = value;
            }
        }

        private int _fat;
        public int Fat
        {
            get => _fat;
            set
            {
                ArgumentOutOfRangeException.ThrowIfNegative(value);
                _fat = value;
            }
        }

        private int _protein;
        public int Protein
        {
            get => _protein;
            set
            {
                ArgumentOutOfRangeException.ThrowIfNegative(value);
                _protein = value;
            }
        }
    }
}