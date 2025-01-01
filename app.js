
const fs = require('fs');

const path = require('path');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const dbPath = path.join(__dirname, 'db.json');

const usersDbPath = path.join(__dirname, 'users.json');

// Helper function to read the users database
const readUsersDB = () => {
    if (!fs.existsSync(usersDbPath)) {
        return [];
    }
    const data = fs.readFileSync(usersDbPath, 'utf8');
    return JSON.parse(data);
};

// Helper function to write to the users database
const writeUsersDB = (data) => {
    fs.writeFileSync(usersDbPath, JSON.stringify(data, null, 2), 'utf8');
};

// Register a new user
const registerUser = async (username, password) => {
    const users = readUsersDB();
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        throw new Error('User already exists');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), username, password: hashedPassword };
    users.push(newUser);
    writeUsersDB(users);
    return newUser;
};

// Authenticate user
const authenticateUser = async (username, password) => {
    const users = readUsersDB();
    const user = users.find(user => user.username === username);
    if (!user) {
        throw new Error('User not found');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error('Invalid password');
    }
    const token = jwt.sign({ id: user.id, username: user.username }, 'your_jwt_secret', { expiresIn: '1h' });
    return token;
};

// Middleware to protect routes
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Access denied' });
    }
    try {
        const verified = jwt.verify(token, 'your_jwt_secret');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

// Register route
app.post('/register', [
    body('username').isLength({ min: 3 }),
    body('password').isLength({ min: 5 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;
    try {
        const newUser = await registerUser(username, password);
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Login route
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const token = await authenticateUser(username, password);
        res.status(200).json({ token });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});
// Helper function to read the database
const readDB = () => {
    if (!fs.existsSync(dbPath)) {
        return [];
    }
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
};

// Helper function to write to the database
const writeDB = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
};

// Create a new note
const createNote = (title, content) => {
    const notes = readDB();
    const newNote = { id: Date.now(), title, content };
    notes.push(newNote);
    writeDB(notes);
    return newNote;
};

// Read all notes
const readNotes = () => {
    return readDB();
};

// Update a note by id
const updateNote = (id, updatedTitle, updatedContent) => {
    const notes = readDB();
    const noteIndex = notes.findIndex(note => note.id === id);
    if (noteIndex === -1) {
        return null;
    }
    notes[noteIndex] = { id, title: updatedTitle, content: updatedContent };
    writeDB(notes);
    return notes[noteIndex];
};

// Delete a note by id
const deleteNote = (id) => {
    const notes = readDB();
    const newNotes = notes.filter(note => note.id !== id);
    if (notes.length === newNotes.length) {
        return false;
    }
    writeDB(newNotes);
    return true;
};

// Example usage
console.log('Creating note:', createNote('First Note', 'This is the content of the first note.'));
console.log('Reading notes:', readNotes());
console.log('Updating note:', updateNote(1, 'Updated Note', 'This is the updated content.'));
console.log('Deleting note:', deleteNote(1));
console.log('Reading notes:', readNotes());
const app = express();
const port = 3000;

app.use(express.json());

// Create a new note
app.post('/notes', (req, res) => {
    const { title, content } = req.body;
    const newNote = createNote(title, content);
    res.status(201).json(newNote);
});

// Read all notes
app.get('/notes', (req, res) => {
    const notes = readNotes();
    res.status(200).json(notes);
});

// Update a note by id
app.put('/notes/:id', (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const updatedNote = updateNote(Number(id), title, content);
    if (updatedNote) {
        res.status(200).json(updatedNote);
    } else {
        res.status(404).json({ message: 'Note not found' });
    }
});

// Delete a note by id
app.delete('/notes/:id', (req, res) => {
    const { id } = req.params;
    const success = deleteNote(Number(id));
    if (success) {
        res.status(200).json({ message: 'Note deleted' });
    } else {
        res.status(404).json({ message: 'Note not found' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});