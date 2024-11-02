import { proto } from "baileys";

export function baileysIs (webMessage: proto.IWebMessageInfo, type) {
    return !!getContent(webMessage, type);
}

export function getContent(webMessage:proto.IWebMessageInfo, type:string) {
    return (
        webMessage?.message?.[`${type}Message`] ||
            webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[`${type}Message`]
    );
}