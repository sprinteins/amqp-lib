import { Connection, Message  } from "../../src/";
import log from "../../src/log";
import config from "../config";

export const worker = async () => {
    try {
        const auth = {
            password: config.messagebrokerpassword,
            url: config.messagebrokerurl,
            username: config.messagebrokerusername,
        };

        const connection = new Connection(auth, {
            interval: 1500,
            retries: 50,
        });

        const queue = connection.registerQueue("task_queue", {
            durable: false,
        });

        const callback = async (message: Message) => {
            const msg = message as Message;
            log.debug("task received by worker: " + JSON.stringify(msg.getContent(), null, 2));
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
