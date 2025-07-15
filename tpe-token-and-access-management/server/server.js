/**
 * Express server for Teams Extension User Demo
 * Provides REST API endpoints for managing Teams Extension User access
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const TeamsExtensionAccessManager = require('./teams-extension-access-manager');

const app = express();
const PORT = config.server.port;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Initialize manager
const accessManager = new TeamsExtensionAccessManager();

/**
 * Add Teams Extension access for a user
 */
app.post('/api/teams-extension/add-access', async (req, res) => {
    try {
        // Get user configuration from server config
        const { userId, tenantId, clientIds } = config.teamsExtension;

        // Validate configuration
        if (!userId || userId === 'YOUR_USER_ID_HERE') {
            return res.status(500).json({ error: 'Server configuration error: userId not configured' });
        }

        if (!tenantId || tenantId === 'YOUR_TENANT_ID_HERE') {
            return res.status(500).json({ error: 'Server configuration error: tenantId not configured' });
        }

        if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0 || 
            clientIds.some(id => !id || id.includes('YOUR_CLIENT_ID'))) {
            return res.status(500).json({ error: 'Server configuration error: clientIds not configured' });
        }

        console.log(`[${new Date().toISOString()}] Adding Teams Extension access for user: ${userId}`);

        const result = await accessManager.addTeamsExtensionAccess(userId, tenantId, clientIds);

        res.json({
            success: true,
            message: 'Teams Extension access successfully added',
            data: result
        });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] API Error:`, error.message);
        
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Remove Teams Extension access for a user
 */
app.post('/api/teams-extension/remove-access', async (req, res) => {
    try {
        // Get user configuration from server config
        const { userId, tenantId } = config.teamsExtension;

        // Validate configuration
        if (!userId || userId === 'YOUR_USER_ID_HERE') {
            return res.status(500).json({ error: 'Server configuration error: userId not configured' });
        }

        if (!tenantId || tenantId === 'YOUR_TENANT_ID_HERE') {
            return res.status(500).json({ error: 'Server configuration error: tenantId not configured' });
        }

        console.log(`[${new Date().toISOString()}] Removing Teams Extension access for user: ${userId}`);

        const result = await accessManager.removeTeamsExtensionAccess(userId, tenantId);

        res.json({
            success: true,
            message: 'Teams Extension access successfully removed',
            data: result
        });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] API Error:`, error.message);
        
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * Serve the main application
 */
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Unhandled error:`, error);
    
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`\n=== Teams Extension User Demo Server ===`);
    console.log(`Server running on port ${PORT}`);
    console.log(`Web interface: http://localhost:${PORT}`);
    console.log(`Started at: ${new Date().toISOString()}`);
    console.log('\nAvailable API endpoints:');
    console.log('  POST /api/teams-extension/add-access');
    console.log('  POST /api/teams-extension/remove-access');
    console.log('\nPress Ctrl+C to stop the server\n');
});

module.exports = app;
