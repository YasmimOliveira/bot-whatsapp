import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "baileys";
import path from 'path'
import P from 'pino'; 
import {Boom} from '@hapi/boom'
import { allowedNumbers } from "./config";
import { baileysIs, getContent } from "./utils";

const logger = P({level: "debug"});

async function connectOnWhatsapp() {
    const {state, saveCreds} = await useMultiFileAuthState(path.resolve(__dirname,'..', 'auth'));

    const socket = makeWASocket({
        auth: state,
        logger,
        printQRInTerminal:true,
    })

    socket.ev.on('connection.update', (update) => {
        const {connection, lastDisconnect} = update;

        if (connection == "close") {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;

            if (shouldReconnect) {
                connectOnWhatsapp();
            }
        }
    });


    socket.ev.on('creds.update', saveCreds);

    socket.ev.on('messages.upsert', async (data) => {
        const [webMessage] = data.messages;

        if (!webMessage) {
            //Verifica se existe mensagem
            return;
        }

        if (!(webMessage['key']['remoteJid'] === allowedNumbers)) {
            //Verifica se o usuário é o meu enviando mensagem, se não for ele retorna.
            return;
        }

        const {
            key: { remoteJid },
            message,
        } = webMessage;

        if (!message) {
            return;
        }

        const isImageMessage = baileysIs(webMessage, "image");
        const isVideoMessage = baileysIs(webMessage, "video");
        const isTextMessage = baileysIs(webMessage, "conversation");
        const isExtendedTextMessage = baileysIs(webMessage, "extendedTextMessage");

        const body =
        message?.conversation ||
        message?.extendedTextMessage?.text ||
        getContent(webMessage, "inage")?.caption ||
        getContent(webMessage, "video")?.caption;

        if (!body || !remoteJid) {
            return;
        }

        //Teste se o robô está on
        if (body.toLocaleUpperCase() == "/PING") {
            await socket.sendMessage(remoteJid, {
                text: `pong!`
            })
        }

        //Teste com figurinha, aqui ele esperar receber uma imagem ou vídeo
        if (body.toLocaleUpperCase() == "/FIG") {
            if(!isImageMessage && !isVideoMessage) {
                await socket.sendMessage(remoteJid, {
                    react: {key:webMessage.key, text:"❌"},
                })

                await socket.sendMessage(remoteJid, {
                    text: `❌ Erro: envie imagem ou vídeo!`
                })
            }

            await socket.sendMessage(remoteJid, {
                text: `⏲️ Fazendo sua figurinha!`
            })
        }
        

    })

}

connectOnWhatsapp();