// server.js

// 1. Import necessary packages
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 2. Set up the Express app and define the port
const app = express();
const port = 3000;

// 3. Connect to the SQLite database (or create it if it doesn't exist)
const db = new sqlite3.Database('./recipes.db', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the recipes database.');
});

// 4. Middleware: These lines are crucial!
app.use(express.json()); // This allows your app to understand JSON data
app.use(express.static('public')); // This serves your frontend files from a 'public' folder

// 5. Create the database tables if they don't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        original_servings INTEGER NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS ingredients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipe_id INTEGER,
        name TEXT NOT NULL,
        quantity TEXT NOT NULL,
        FOREIGN KEY (recipe_id) REFERENCES recipes (id)
    )`);
    console.log("Database tables are ready.");
});

// 6. Define an API endpoint to CREATE a new recipe
app.post('/api/recipes', (req, res) => {
    const { name, original_servings, ingredients } = req.body;

    // First, insert the main recipe
    db.run('INSERT INTO recipes (name, original_servings) VALUES (?, ?)', [name, original_servings], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        const recipeId = this.lastID; // Get the ID of the recipe we just inserted

        // Then, insert all the ingredients for that recipe
        const stmt = db.prepare('INSERT INTO ingredients (recipe_id, name, quantity) VALUES (?, ?, ?)');
        for (const ing of ingredients) {
            stmt.run(recipeId, ing.name, ing.quantity);
        }
        stmt.finalize();

        res.status(201).json({ id: recipeId, name, original_servings, ingredients });
    });
});

// 7. Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});