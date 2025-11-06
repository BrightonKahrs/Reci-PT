using System;

namespace RecipeAppBackend.Models
{
    public class RecipeStep
    {
        private string _stepText;
        public string StepText
        {
            get => _stepText;
            set
            {
                if (string.IsNullOrWhiteSpace(value) || value.Length < 3) throw new ArgumentException(nameof(value), "StepText must be at least 3 characters and cannot be null");
                _stepText = value;
            }
        }

        private int _stepTotalTime;
        public int StepTotalTime
        {
            get => _stepTotalTime;
            set
            {
                ArgumentOutOfRangeException.ThrowIfNegative(value);
                if (_stepHandsOnTime > value) throw new ArgumentOutOfRangeException(nameof(value), "StepHandsOnTime should never exceed StepTotalTime");
                _stepTotalTime = value;
            }
        }

        private int _stepHandsOnTime;
        public int StepHandsOnTime
        {
            get => _stepHandsOnTime;
            set
            {
                ArgumentOutOfRangeException.ThrowIfNegative(value);
                if (value > _stepTotalTime) throw new ArgumentOutOfRangeException(nameof(value), "StepHandsOnTime should never exceed StepTotalTime");
                _stepHandsOnTime = value;
            }
        }

        public RecipeStep(string stepText, int stepTotalTime = 0, int stepHandsOnTime = 0)
        {
            StepText = stepText;
            StepTotalTime = stepTotalTime;
            StepHandsOnTime = stepHandsOnTime;
        }
    }
}