// public/script.js - Final Robust Version
document.addEventListener('DOMContentLoaded', () => {

    const recipeForm = document.getElementById('recipe-form');
    const ingredientsContainer = document.getElementById('ingredients-container');
    const addIngredientBtn = document.getElementById('add-ingredient-btn');
    const recipesListDiv = document.getElementById('recipes-list');

    // --- FUNCTION: Add Ingredient Input Fields ---
    function addIngredientFields() {
        const div = document.createElement('div');
        div.classList.add('ingredient-input-group');
        div.innerHTML = `
            <input type="text" placeholder="Quantity (e.g., 200g)" class="ingredient-qty" required>
            <input type="text" placeholder="Name (e.g., Flour)" class="ingredient-name" required>
        `;
        ingredientsContainer.appendChild(div);
    }

    // --- FUNCTION: Fetch and Display Recipes ---
    async function fetchAndDisplayRecipes() {
        try {
            console.log('Attempting to fetch recipes...');
            const response = await fetch('/api/recipes');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const recipes = await response.json();
            console.log('Successfully fetched recipes:', recipes);
            recipesListDiv.innerHTML = '';
            if (recipes.length === 0) {
                recipesListDiv.innerHTML = '<p>No recipes saved yet.</p>';
                return;
            }
            recipes.forEach(recipe => {
                const recipeElement = document.createElement('div');
                recipeElement.classList.add('recipe-item');
                recipeElement.dataset.recipeId = recipe.id;
                const ingredientList = recipe.ingredients.map(ing => `<li>${ing.quantity} ${ing.name}</li>`).join('');
                recipeElement.innerHTML = `
                    <h3>${recipe.name}</h3>
                    <p><strong>Original Servings:</strong> ${recipe.original_servings}</p>
                    <div class="ingredients-display">
                        <h4>Ingredients:</h4>
                        <ul class="ingredient-list">
                            ${ingredientList}
                        </ul>
                    </div>
                    <div class="scaler-section">
                        <h4>Scale Recipe:</h4>
                        <input type="number" class="new-servings-input" placeholder="New servings" min="1">
                        <button class="scale-recipe-btn">Scale</button>
                    </div>
                    <hr>
                `;
                recipesListDiv.appendChild(recipeElement);
            });
        } catch (error) {
            console.error('Error in fetchAndDisplayRecipes:', error);
            recipesListDiv.innerHTML = '<p>Could not load recipes.</p>';
        }
    }

    // --- EVENT DELEGATION for Scale Buttons ---
    recipesListDiv.addEventListener('click', async (e) => {
        // Use .closest() to find the button, even if the text inside is clicked
        const scaleButton = e.target.closest('.scale-recipe-btn');

        // If a scale button (or one of its children) was clicked...
        if (scaleButton) {
            console.log('Scale button click detected!'); // This should now always appear
            
            const recipeElement = e.target.closest('.recipe-item');
            const recipeId = recipeElement.dataset.recipeId;
            const newServingsInput = recipeElement.querySelector('.new-servings-input');
            const newServings = newServingsInput.value;

            if (!newServings || newServings <= 0) {
                alert('Please enter a valid number of servings.');
                return;
            }

            try {
                const url = `/api/recipes/${recipeId}/scale?servings=${newServings}`;
                console.log('About to fetch from URL:', url); // This should now appear

                const response = await fetch(url);
                console.log('Got response from server:', response); // This should now appear

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to scale recipe');
                }
                
                const scaledRecipe = await response.json();
                console.log('Successfully scaled recipe:', scaledRecipe);

                const ingredientListUl = recipeElement.querySelector('.ingredient-list');
                const newIngredientList = scaledRecipe.ingredients.map(ing => `<li>${ing.quantity} ${ing.name}</li>`).join('');
                ingredientListUl.innerHTML = newIngredientList;

                const title = recipeElement.querySelector('h3');
                title.innerHTML = `${scaledRecipe.name} <span style="color: green; font-size: 0.8em;">(Scaled for ${scaledRecipe.scaled_for_servings} servings)</span>`;

            } catch (error) {
                console.error('Error scaling recipe:', error);
                alert(error.message);
            }
        }
    });

    // --- EVENT LISTENERS ---
    addIngredientBtn.addEventListener('click', addIngredientFields);
    recipeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const original_servings = parseInt(document.getElementById('servings').value);
        const ingredientGroups = document.querySelectorAll('.ingredient-input-group');
        const ingredients = Array.from(ingredientGroups).map(group => ({
            quantity: group.querySelector('.ingredient-qty').value,
            name: group.querySelector('.ingredient-name').value
        }));
        const recipeData = { name, original_servings, ingredients };

        try {
            await fetch('/api/recipes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(recipeData),
            });
            alert('Recipe saved successfully!');
            recipeForm.reset();
            ingredientsContainer.innerHTML = '';
            addIngredientFields();
            fetchAndDisplayRecipes();
        } catch (error) {
            console.error('Error saving recipe:', error);
            alert('Failed to save recipe.');
        }
    });

    // --- Initial Load ---
    addIngredientFields();
    fetchAndDisplayRecipes();
});