import { proto } from "baileys";

export function getContent(webMessage:proto.IWebMessageInfo, type:string) {
    return (
        webMessage?.message?.[`${type}Message`] ||
            webMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.[`${type}Message`]
    );
}