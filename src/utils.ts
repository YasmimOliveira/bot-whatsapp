import { downloadContentFromMessage, MediaType, proto } from "baileys";
import { writeFile } from "fs/promises";
import path from 'path'
import ffmpeg from "fluent-ffmpeg"
const fs = require('fs');

export function baileysIs (webMessage: proto.IWebMessageInfo, type) {
    return !!getContent(webMessage, type);
}

export function getContent(webMessage:proto.IWebMessageInfo, type:string) {
    return (
        webMessage?.message?.[`${type}Message`] ||
            webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[`${type}Message`]
    );
}

export async function dowloadContent( {webMessage,type} : {webMessage: proto.IWebMessageInfo, type:MediaType}) {
    const content = getContent(webMessage,type);

    const extension = type == "image" ? "png" : "mp4";

    const stream = await downloadContentFromMessage(content,type);

    let buffer = Buffer.from([]);

    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer,chunk]);
    }

    const filePath = path.resolve(tempPath(),`${generateRandomFileName()}.${extension}`)
    
    await writeFile(filePath, buffer);

    return filePath;
}

export async function convertImage(imagePath: string, outputName: string) {
    const outputFile = path.resolve(tempPath(), outputName);
    
    ffmpeg().input(imagePath).saveToFile(outputFile);

    return outputFile;
}

export function tempPath() {
    const tempPath = path.resolve(__dirname,'..', 'temp');

    try {
        if (!fs.existsSync(tempPath)) {
            fs.mkdirSync(tempPath);
        }
    } catch (err) {
        console.error(err);
    }

    return tempPath;
}

export function generateRandomFileName() {
    return (
        Math.random().toString(36).substring(2,15) +
        Math.random().toString(36).substring(2,15) 
    )
}

export function getFileNameWithoutExtesion(filePath: string) {
    return path.basename(filePath, path.extname(filePath));
}