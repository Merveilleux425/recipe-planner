// public/script.js
document.addEventListener('DOMContentLoaded', () => {

    const recipeForm = document.getElementById('recipe-form');
    const ingredientsContainer = document.getElementById('ingredients-container');
    const addIngredientBtn = document.getElementById('add-ingredient-btn');

    // Start with one ingredient input field
    addIngredientFields();

    // Function to add a new ingredient input pair
    function addIngredientFields() {
        const div = document.createElement('div');
        div.classList.add('ingredient-input-group');
        div.innerHTML = `
            <input type="text" placeholder="Quantity (e.g., 200g)" class="ingredient-qty" required>
            <input type="text" placeholder="Name (e.g., Flour)" class="ingredient-name" required>
        `;
        ingredientsContainer.appendChild(div);
    }

    // Event listener for the "Add Ingredient" button
    addIngredientBtn.addEventListener('click', addIngredientFields);

    // Event listener for the form submission
    recipeForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // IMPORTANT: Prevents the page from reloading

        // 1. Get the recipe name and servings from the form
        const name = document.getElementById('name').value;
        const original_servings = parseInt(document.getElementById('servings').value);

        // 2. Get all the ingredients from the form
        const ingredientGroups = document.querySelectorAll('.ingredient-input-group');
        const ingredients = Array.from(ingredientGroups).map(group => ({
            quantity: group.querySelector('.ingredient-qty').value,
            name: group.querySelector('.ingredient-name').value
        }));

        // 3. Create the data object to send to the backend
        const recipeData = { name, original_servings, ingredients };

        // 4. Send the data to our backend API using the Fetch API
        try {
            const response = await fetch('/api/recipes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(recipeData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('Recipe saved successfully:', result);
            alert('Recipe saved successfully!');
            recipeForm.reset();
            ingredientsContainer.innerHTML = ''; // Clear old inputs
            addIngredientFields(); // Add one fresh input field

        } catch (error) {
            console.error('Error saving recipe:', error);
            alert('Failed to save recipe. Check the console for details.');
        }
    });
});