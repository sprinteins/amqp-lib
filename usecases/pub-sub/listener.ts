import { Connection, Message } from "../../src/";
import log from "../../src/log";
import config from "../config";

export const listener = async () => {
    try {
        const connection = new Connection(config.messagebrokerurl);
        const exhcange = connection.registerExchange(
            "exchange",
            "fanout",
            {
                durable: false,
            },
        );
        const queue = connection.registerQueue("someQueue", {
            durable: false,
        });
        await queue.bind(exhcange);

        const callback = async (message: Message) => {
            const msg = message as Message;
            log.debug("message received by listener: " + JSON.stringify(msg.getContent(), null, 2));
            msg.ack();
        };

        await queue.subscribeConsumer(callback, {
            manualAck: false,
            noAck: false,
        });
        setTimeout(async () => {
            // await connection.close();
        }, 500);
    } catch (error) {
        log.error(error);
    }
};
