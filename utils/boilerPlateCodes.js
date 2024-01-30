const expressBp =
`const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse incoming JSON requests
app.use(express.json());

// Simple route example
app.get('/', (req, res) => {
    res.send('Hello, Express!');
});

// Start the server
app.listen(port, () => {
    console.log(\`Server is running on http://localhost:\${port}\`);
});

// Additional code related to your application can be added below
// For example, you can include routes, database connections, etc.
`;

const fastifyBp = 
`const fastify = require('fastify')({ logger: true });

// Declare a route
fastify.get('/', async (request, reply) => {
  return { hello: 'Fastify!' };
});

// Run the server
const start = async () => {
  try {
    await fastify.listen(3000);
    fastify.log.info(\`Server is running on http://localhost:3000\`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
`
const expressPackageJson = {
    "name": "your_project_name",
    "version": "1.0.0",
    "description": "Your project description",
    "main": "src/app.js",
    "scripts": {
        "start": "node src/app.js"
    },
    "keywords": [],
    "author": "Your Name",
    "license": "MIT",
    "dependencies": {
        "express": "^4.17.1"
    }
}

const fastifyPackageJson = {
    "name": "your_project_name",
    "version": "1.0.0",
    "description": "Your project description",
    "main": "src/app.js",
    "scripts": {
        "start": "node src/app.js"
    },
    "keywords": [],
    "author": "Your Name",
    "license": "MIT",
    "dependencies": {
        "fastify": "^3.19.0"
    }
}

module.exports = {expressBp , fastifyBp , expressPackageJson , fastifyPackageJson};