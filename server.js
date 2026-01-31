// server.js - Using built-in fs module, no external database library

// 1. Import necessary packages
const express = require('express');
const fs = require('fs').promises; // Use the promise-based version of fs
const path = require('path');

// 2. Set up the Express app and define the port
const app = express();
const port = 3000;
const dbPath = path.join(__dirname, 'db.json'); // Get the absolute path to our db file

// 4. Middleware
app.use(express.json());
app.use(express.static('public'));

// --- Helper Functions to Read and Write the DB ---

async function getDb() {
    try {
        const data = await fs.readFile(dbPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        // If the file doesn't exist, return a default structure
        if (error.code === 'ENOENT') {
            return { recipes: [] };
        }
        throw error;
    }
}

async function saveDb(data) {
    await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf-8');
}


// --- API Endpoints ---

// POST /api/recipes - Create a new recipe
app.post('/api/recipes', async (req, res) => {
    try {
        const db = await getDb();
        const { name, original_servings, ingredients } = req.body;
        const newRecipe = { id: Date.now(), name, original_servings, ingredients };
        db.recipes.push(newRecipe);
        await saveDb(db);
        res.status(201).json(newRecipe);
    } catch (err) {
        res.status(500).json({ error: 'Failed to save recipe' });
    }
});

// GET /api/recipes - Get all recipes
app.get('/api/recipes', async (req, res) => {
    try {
        const db = await getDb();
        res.json(db.recipes);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch recipes' });
    }
});

// GET /api/recipes/:id/scale - Scale a specific recipe
app.get('/api/recipes/:id/scale', async (req, res) => {
    try {
        const db = await getDb();
        const { id } = req.params;
        const { servings: newServings } = req.query;

        const recipe = db.recipes.find(r => r.id == id);

        if (!recipe) {
            return res.status(404).json({ error: 'Recipe not found' });
        }

        if (!newServings || isNaN(newServings)) {
            return res.status(400).json({ error: 'Please provide a valid number of servings' });
        }

        const scaleFactor = newServings / recipe.original_servings;
        const scaledIngredients = recipe.ingredients.map(ing => {
            const quantityMatch = ing.quantity.match(/^(\d+\.?\d*)/);
            if (quantityMatch) {
                const originalQuantity = parseFloat(quantityMatch[0]);
                const scaledQuantity = (originalQuantity * scaleFactor).toFixed(2);
                const unit = ing.quantity.substring(quantityMatch[0].length).trim();
                return { ...ing, quantity: `${scaledQuantity} ${unit}` };
            }
            return ing;
        });

        res.json({
            ...recipe,
            scaled_for_servings: parseInt(newServings),
            ingredients: scaledIngredients
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to scale recipe' });
    }
});

// 7. Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});