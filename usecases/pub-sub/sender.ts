import { Connection, Message } from "../../src/";
import log from "../../src/log";
import config from "../config";

export const sender = async () => {
    const mockMessage = {
        message: "This is a publisher",
    };

    const connection = new Connection(config.messagebrokerurl, {
        interval: 5000,
        retries: 5000,
    });

    const exchange = connection.registerExchange("exchange", "fanout", {
        durable: false,
    });

    const message = new Message(mockMessage, { persistent: false });

    await message.send(exchange);
    log.debug("sent message: " + JSON.stringify(message.getContent(), null, 2));

    setTimeout(async () => {
        // await connection.close();
    }, 500);
};
