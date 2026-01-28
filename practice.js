const express = require('express'); // Import express
const app = express(); // Create constant for express instance as app
const port = 3000; // Choose port 3000

app.use(express.json()); // Tell express to use JSON data type

// Define allowed states
const allowedStates = [ 'active', 'inactive' ];

// Define users as list
const users = [
    { 
        id: 'a7954559-0a1a-4792-b3d5-1a7b614e9aa1',
        email: 'cohenherbert37@gmail.com',
        hash: '$2b$12$jQWvxLWP9DdORM45HbKyve6W6E1ShCkfL8655DkkVfdc3jdixqlRm'
    },
];

// Define clients as list
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

// /users route to return all users with nonsensitive data only
app.get('/users', (req, res) => {
    const safeUsers = [];
    users.forEach(user => {
        safeUsers.push({
            id: user.id,
            email: user.email
        });
    });
    res.status(200).json(safeUsers);
});

// /clients/search route to explicitly search for clients
app.get('/clients/search', (req, res) => {
    const { status, domain } = req.query;
    let filteredClients = clients;
    if (status) {
        filteredClients = filteredClients.filter(c => c.status === status);
    };
    if (domain) {
        filteredClients = filteredClients.filter(c => c.email.split('@')[1] === domain);
    };
    res.status(200).json(filteredClients);
});

app.post('/clients/:id/toggle-status', (req, res) => {
    const id = req.params.id;
    const index = clients.findIndex(c => c.id === id);
    if (index === -1) {
        return res.status(404).json({error: 'Client not found'});
    };

    const client = clients[index];
    if (!allowedStates.includes(client.status)) {
        return res.status(400).json({error: 'Status not toggle-able'})
    }

    clients[index].status = client.status === 'active' ? 'inactive' : 'active';

    res.status(200).json(client);
});

// Start server
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});