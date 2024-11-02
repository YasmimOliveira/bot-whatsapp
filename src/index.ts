import makeWASocket, { DisconnectReason, useMultiFileAuthState } from "baileys";
import path from 'path'
import P from 'pino'; 
import {Boom} from '@hapi/boom'
import { allowedNumbers } from "./config";

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

        const text = message.conversation;

        if (text == "oi") {
            await socket.sendMessage(remoteJid, {text:'olá'});
        }

        // console.log(JSON.stringify(message,null,2));
        

    })

}

connectOnWhatsapp();