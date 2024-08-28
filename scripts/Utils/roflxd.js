const fs = require('fs');
const path = require('path');
const { Buffer } = require('buffer');

async function loadFromStream(stream) {
    const gameVersionBytes = await readBytesAsync(stream, 14, 15, 0);
    const gameVersion = gameVersionBytes.toString('utf8');

    const metadataLengthBytes = await readBytesAsync(stream, 4, -4, 2);
    const metadataLength = metadataLengthBytes.readInt32LE(0);
    const metadataStart = -(metadataLength + 4);
    const metadataBytes = await readBytesAsync(stream, metadataLength, metadataStart, 2);

    return new Metadata2(metadataBytes, gameVersion);
}

async function readBytesAsync(fileHandle, count, offset, origin) {
    const buffer = Buffer.alloc(count);
    const stats = await fileHandle.stat();
    let position;

    if (origin === 0) {
        position = offset;
    } else if (origin === 1) {
        position = (await fileHandle.read(buffer, 0, 0, null)).bytesRead + offset;
    } else if (origin === 2) {
        position = stats.size + offset;
    } else {
        throw new Error("Invalid SeekOrigin");
    }

    await fileHandle.read(buffer, 0, count, position);
    if (buffer.length !== count) {
        throw new Error("did not read correct amount of bytes");
    }

    return buffer;
}

class Metadata2 {
    constructor(byteData, gameVersion) {
        const rawMetadata = JSON.parse(byteData.toString('utf8'));
        if (!rawMetadata) throw new Error("RawMetadata parsed to null");

        this.gameLength = rawMetadata.gameLength;
        this.gameVersion = gameVersion;
        this.lastGameChunkId = rawMetadata.lastGameChunkId;
        this.lastKeyframeId = rawMetadata.lastKeyFrameId;
        this.statsJson = this.deserializePlayerStats(rawMetadata.statsJson);
    }

    deserializePlayerStats(statsJson) {
        if (!statsJson) throw new Error("PlayerStats[] parsed to null");
        return JSON.parse(statsJson);
    }

    async toJsonFile(outputDir) {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const outputFile = path.join(outputDir, `${timestamp}_metadata.json`);
        await fs.promises.writeFile(outputFile, JSON.stringify(this, { spaces: 2 }));
        return outputFile;
    }
}

const parseROFL = async (filePath) => {
    const outputDir = 'json';
    const fileHandle = await fs.promises.open(filePath, 'r');

    try {
        const data = await loadFromStream(fileHandle);
        const outputFile = await data.toJsonFile(outputDir);
        console.log(`Saved file: "${outputFile}"`);
        return outputFile
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await fileHandle.close();
    }
}

module.exports = {
    parseROFL
}