import { Connection, Message } from "../../src/";
import log from "../../src/log";
import config from "../config";

export const sender = async () => {

    const key = "anonymous.super.natural";

    const mockMessage = {
        message: "This is a topics routing",
    };

    const connection = new Connection(config.messagebrokerurl, {
        interval: 1000,
        retries: 50,
    });

    const exchange = connection.registerExchange("topics_exchange", "topic", {
        durable: false,
    });

    const message = new Message(mockMessage, { persistent: false });

    await message.send(exchange, key);
    log.debug("sent message with topic routing: " + JSON.stringify(message.getContent(), null, 2));

    setTimeout(async () => {
        // await connection.close();
    }, 500);
};
