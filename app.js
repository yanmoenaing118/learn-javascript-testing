const fs = require('fs');
const path = require('path');
const express = require('express');

const dbPath = path.join(__dirname, 'db.json');

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