import express from 'express';
import path from 'path';
import fs from "fs";


const mediaController = express.Router();

// Define the GET route to serve the audio file
mediaController.get("/audioprompt/:filename", (req, res) => {
    const filename = req.params.filename;
    const audioFilePath = path.join(process.env.BASE_MEDIA_PATH, filename);

    // Read the audio file
    fs.readFile(audioFilePath, (err, data) => {
        if (err) {
            console.error("Failed to read audio file:", err);
            res.status(500).send("Internal Server Error");
            return;
        }

        // Set the appropriate response headers
        res.set("Content-Type", "audio/wav");
        res.set("Content-Length", data.length.toString());
        res.set("Cache-Control", "no-cache, no-store");
        res.set("Pragma", "no-cache");

        // Send the audio file as the response
        res.send(data);
    });
});

export { mediaController };