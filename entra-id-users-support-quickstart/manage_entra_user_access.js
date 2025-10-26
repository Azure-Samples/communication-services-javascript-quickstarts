const crypto = require('crypto');
const https = require('https');
const { URL } = require('url');
// Replace <ACS_Resource_Endpoint> and <ACS_Resource_Key> with your actual ACS resource endpoint and key
// You can find these in the Azure portal under your Communication Services resource
const endpoint = "<ACS_Resource_Endpoint>";
const key = "<ACS_Resource_Key>";
const apiVersion = '2025-03-02-preview';

async function main() {
    const objectId = "<OBJECT_ID>"; // Replace with the actual object ID
    const tenantId = "<TENANT_ID>"; // Replace with the actual tenant ID
    const clientId = "<CLIENT_ID>"; // Replace with the actual client ID
    const assignment = {
        tenantId: tenantId,
        // Type of the principal accessing the resource. Possible values are: "user", "group" or "tenant".
        principalType: "user", 
        clientIds: [clientId], 
    };
    try {
        // List all assignments
        const assignments = await listAssignments();
        console.log("Assignments:", assignments);

        // Create or update an assignment
        const createResponse = await createOrUpdateAssignment(objectId, assignment);
        console.log("Create or Update Assignment Response:", createResponse);

        // Get a specific assignment by objectId
        const getResponse = await getAssignment(objectId);
        console.log("Get Assignment Response:", getResponse);

        // Update assignments
        const updateAssignmentsDict = {};
        updateAssignmentsDict[objectId] = {
                    principalType: "group",
                    tenantId: tenantId,
                    clientIds: [clientId],
        };
        const updateResponse = await updateAssignments(updateAssignmentsDict);
        console.log("Update Assignments Response:", updateResponse);

        // Delete an assignment by objectId
        const deleteResponse = await deleteAssignment(objectId);
        console.log("Delete Assignment Response:", deleteResponse);

    } catch (error) {
        console.error("Error:", error);
    }
}

function listAssignments() {
    const apiUrl = endpoint.replace(/\/+$/, '') + '/access/entra/assignments?api-version=' + apiVersion;
    const urlObj = new URL(apiUrl);
    const getMethod = 'GET';

    const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: getMethod,
        headers: generateSignedHeaders({
            url: apiUrl,
            method: getMethod,
            body: ''
        })
    };

    return sendRequest(options);
}

async function createOrUpdateAssignment(objectId, assignment) {
    const path = `/access/entra/assignments/${objectId}?api-version=${apiVersion}`;
    const apiUrl = endpoint.replace(/\/+$/, '') + path;
    const urlObj = new URL(apiUrl);
    const putMethod = 'PUT';
    const body = JSON.stringify(assignment);
    const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: putMethod,
        headers: generateSignedHeaders({
            url: apiUrl,
            method: putMethod,
            body: body
        })
    };

    return sendRequest(options, body);
}

async function updateAssignments(assignments) {
    const path = `/access/entra/assignments?api-version=${apiVersion}`;
    const apiUrl = endpoint.replace(/\/+$/, '') + path;
    const urlObj = new URL(apiUrl);
    const patchMethod = 'PATCH';
    const body = JSON.stringify(assignments);

    const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: patchMethod,
        headers: generateSignedHeaders({
            url: apiUrl,
            method: patchMethod,
            body: body,
            contentType: "application/merge-patch+json"
        })
    };

    return sendRequest(options, body);
}

async function getAssignment(objectId) {
    const path = `/access/entra/assignments/${objectId}?api-version=${apiVersion}`;
    const apiUrl = endpoint.replace(/\/+$/, '') + path;
    const urlObj = new URL(apiUrl);
    const getMethod = 'GET';

    const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: getMethod,
        headers: generateSignedHeaders({
            url: apiUrl,
            method: getMethod,
            body: ''
        })
    };

    return sendRequest(options);
}

async function deleteAssignment(objectId) {
    const path = `/access/entra/assignments/${objectId}?api-version=${apiVersion}`;
    const apiUrl = endpoint.replace(/\/+$/, '') + path;
    const urlObj = new URL(apiUrl);
    const deleteMethod = 'DELETE';

    const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: deleteMethod,
        headers: generateSignedHeaders({
            url: apiUrl,
            method: deleteMethod,
            body: ''
        })
    };

    return sendRequest(options);
}

function generateSignedHeaders({ url, method = 'GET', body = '', contentType = 'application/json' }) {
    const verb = method.toUpperCase();
    const utcNow = new Date().toUTCString();
    const contentHash = crypto.createHash('sha256').update(body, 'utf8').digest('base64');
    const dateHeader = "x-ms-date";
    const signedHeaders = `${dateHeader};host;x-ms-content-sha256`;

    const urlObj = new URL(url);
    const query = urlObj.searchParams.toString();
    const urlPathAndQuery = query ? `${urlObj.pathname}?${query}` : urlObj.pathname;
    const port = urlObj.port;
    const hostAndPort = port ? `${urlObj.host}:${port}` : urlObj.host;

    const stringToSign = `${verb}\n${urlPathAndQuery}\n${utcNow};${hostAndPort};${contentHash}`;
    const signature = crypto.createHmac('sha256', Buffer.from(key, 'base64')).update(stringToSign, 'utf8').digest('base64');

    return {
        Host: hostAndPort,
        [dateHeader]: utcNow,
        "x-ms-content-sha256": contentHash,
        "Content-Type": contentType,
        "Authorization": `HMAC-SHA256 SignedHeaders=${signedHeaders}&Signature=${signature}`
    };
}

function sendRequest(requestOptions,  body = '') {
    return new Promise((resolve, reject) => {
            const req = https.request(requestOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const json = data ? JSON.parse(data) : {};
                        resolve(json);
                    } catch (err) {
                        reject(err);
                    }
                });
            });

            req.on('error', (err) => {
                reject(err);
            });

             // Write body if present and not empty
            if (body && body.length > 0) {
                req.write(body);
            }

            req.end();
        });
}

main();