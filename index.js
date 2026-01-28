const express = require('express');
const crypto = require('crypto'); // Crypto to create UUIDs
const bcrypt = require('bcrypt');
const app = express();
const port = 3000; // Define server port
const corsMiddleware = require('./middleware/cors');
const { eventsHandler, sendEvent } = require('./middleware/events');

app.use(express.json()); // Tell express to use json
app.use(corsMiddleware);

app.get('/events', eventsHandler);

// ------- Constants -------

// Hardcoded clients for testing
const clients = [
    { 
        id: 'e8a9e648-77e1-4e10-8788-ceb41201ee0b',
        name: 'Acme Corp',
        email: 'contact@acme.com',
        status: 'active' 
    },
    {
        id: '88a5d97b-93d6-4e00-9ff0-0d8eee016fd7',
        name: 'Tech Startup',
        email: 'hello@tech.com',
        status: 'inactive' 
    },
];

const users = [
    { 
        id: 'a7954559-0a1a-4792-b3d5-1a7b614e9aa1',
        email: 'cohenherbert37@gmail.com',
        hash: '$2b$12$jQWvxLWP9DdORM45HbKyve6W6E1ShCkfL8655DkkVfdc3jdixqlRm'
    },
];

// ------- Helper Functions -------

// Set allowed states
const allowedStates = [ 'active', 'inactive', 'pending' ];

// Helper function to retrieve index from id
function getIndex(id) {
    return clients.findIndex(c => c.id === id);
};

// Helper function to check if string is empty
function isNonEmptyString(string) {
    if (!string) {
        return false;
    };
    const nonEmptyString = string.trim();
    return nonEmptyString.length > 0;
};

// Helper function to check if request body is empty
function isNonEmptyJson(json) {
    if (!json || typeof json !== 'object') {
        return false;
    };

    let hasNonEmptyValue = false;
    for (const key of Object.keys(json)) {
        const value = json[key];
        if (typeof value === 'string' && value.trim().length > 0) {
            hasNonEmptyValue = true;
        } else if (value !== null && value !== undefined && typeof value !== 'string') {
            hasNonEmptyValue = true;
        };
    };
    return hasNonEmptyValue;
};

async function hashPassword(password) {
    const saltRounds = 12;
    const hash = await bcrypt.hash(password, saltRounds);
    return hash;
};

async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
};

// Helper function to validate email
function isValidEmail(email) {
    // return email.includes('@');
    return true;
};

// ------- Middleware Functions -------

// Middleware function to require auth on certain routes
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    };

    const token = authHeader.split(' ')[1];

    if (token !== 'fake-token-123') {
        return res.status(401).json({ error: 'Invalid token' });
    };

    const user = users[0];

    req.user = {
        id: user.id,
        email: user.email
    };

    next();
};

app.use('/clients', requireAuth); // Tell express to require jwt authorization on all /clients routes

// ------- /Client Routes -------

// Get retrieves data, and does not update or change server
app.get('/clients', (req, res) => {
    const { email, status } = req.query;
    let result = clients;

    if (email) {
        result = result.filter(c => c.email === email);
    };
    if (status) {
        result = result.filter(c => c.status === status);
    };

    res.status(200).send(result);
});

// Get by id
app.get('/clients/:id', (req, res) => {
    const id = req.params.id;
    const client = clients.find(c => c.id === id);
    if (!client) {
        return res.status(404).json({ error: 'Client not found' });
    };
    res.status(200).send(client);
});

// Post creates something or triggers something
app.post('/clients', (req, res) => {
    const { name, email, status } = req.body;

    if (email && !isValidEmail(email.toLowerCase().trim())) {
        return res.status(400).json({ error: 'Email invalid' })
    };

    if (status && !allowedStates.includes(status)) {
        return res.status(400).json({ error: 'Status invalid' });
    };

    const newClient = {
        'id': crypto.randomUUID(),
        'name': name ? name.trim() : '',
        'email': email ? email.toLowerCase().trim() : '', // TODO: Add client@stack.com as placeholder in frontend
        'status': status ? status : '',
    };
    clients.push(newClient);

    sendEvent({ type: 'clients_changed'});

    res.status(201).json(newClient);
});

// Update client from id
app.put('/clients/:id', (req, res) => {
    const id = req.params.id;
    const index = getIndex(id);
    if (index === -1) {
        return res.status(404).json({ error: 'Client not found' });
    }

    const { name, email, status } = req.body;

    let errors = [];
    if (!isNonEmptyString(name)) {errors.push('Name is missing')};
    if (!isNonEmptyString(email)) {errors.push('Email is missing')};
    if (!isNonEmptyString(status)) {errors.push('Status is missing')};
    
    if (errors.length > 0) {
        return res.status(400).json({ error: errors });
    };

    if (!isValidEmail(email.toLowerCase().trim())) {
        return res.status(400).json({ error: 'Email invalid' });
    };

    if (status && !allowedStates.includes(status)) {
        return res.status(400).json({ error: 'Status invalid' });
    };
    
    const updatedClient = {
        id: clients[index].id,
        name: name,
        email: email.toLowerCase().trim(),
        status: status
    };
    clients[index] = updatedClient;
    res.status(200).json(updatedClient);
});

// Update select things in client
app.patch('/clients/:id', (req, res) => {
    const id = req.params.id;
    const { name, email, status } = req.body;

    if (email && !isValidEmail(email.toLowerCase().trim())) {
        return res.status(400).json({error: 'Invalid email'});
    };

    if (status && !allowedStates.includes(status)) {
        return res.status(400).json({error: 'Invalid status'});
    };

    const index = getIndex(id);

    if (index === -1) {
        return res.status(404).json({ error: 'Client not found' });
    };

    const client = clients[index];
    const updatedClient = { 
        id: clients[index].id,
        name: name ?? client.name,
        email: (email && email.toLowerCase().trim()) ?? client.email,
        status: status ?? client.status
    };

    clients[index] = updatedClient;
    res.status(200).json(updatedClient);
});

// Delete clients from id
app.delete('/clients/:id', (req, res) => {
    const id = req.params.id;
    const index = getIndex(id);
    if (index === -1) {
        return res.status(404).json({ error: 'Client not found' });
    };
    clients.splice(index, 1);
    res.status(204).send();
});

// ------- Auth Routes -------

// Post route for login with token and user data
app.post('/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!isNonEmptyString(email)) {
        return res.status(400).json({ error: 'Email is required' });
    };

    if (!isNonEmptyString(password)) {
        return res.status(400).json({ error: 'Password is required' });
    };

    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    };

    const user = users.find(u => u.email === email.toLowerCase().trim());

    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    };

    if (!await verifyPassword(password, user.hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
    };

    res.status(200).json({
        token: 'fake-token-123',
        user: {
            id: user.id,
            email: user.email
        }
    });
});

// Post route for register
app.post('/auth/register', async (req, res) => {
    const { email, password } = req.body;

    if (!isNonEmptyString(email)) {
        return res.status(400).json({ error: 'Email is required' });
    };

    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Invalid email format' });
    };

    if (!isNonEmptyString(password)) {
        return res.status(400).json({ error: 'Password is required' });
    };

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    };

    const user = users.find(u => u.email === email.toLowerCase().trim());

    if (user) {
        return res.status(409).json({ error: 'Email already in use' });
    };

    const newUser = {
        id: crypto.randomUUID(),
        email: email.toLowerCase().trim(),
        hash: await hashPassword(password.trim())
    };

    users.push(newUser);
    res.status(201).json({
        token: 'fake-token-123',
        user: {
            id: newUser.id,
            email: newUser.email
        }
    });
});

// Start server
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});