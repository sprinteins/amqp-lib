import { Connection, Message } from "../../src/";
import log from "../../src/log";
import config from "../config";

export const scheduler = async () => {
    const mockMessage = {
        message: "remove_data_task",
    };

    const connection = new Connection(config.messagebrokerurl, {
        interval: 5000,
        retries: 5000,
    });

    const queue = connection.registerQueue("task_queue", {
        durable: false,
    });

    const message = new Message(mockMessage, { persistent: true });

    await message.send(queue);
    log.debug("sent task by scheduler: " + JSON.stringify(message.getContent(), null, 2));

    setTimeout(async () => {
        // await connection.close();
    }, 500);
};
