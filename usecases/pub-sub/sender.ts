import { Connection, Message } from "../../src/";
import log from "../../src/log";
import config from "../config";

export const sender = async () => {
    const mockMessage = {
        message: "This is a publisher",
    };

    const auth = {
        password: config.messagebrokerpassword,
        url: config.messagebrokerurl,
        username: config.messagebrokerusername,
    };

    const connection = new Connection(auth);

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
