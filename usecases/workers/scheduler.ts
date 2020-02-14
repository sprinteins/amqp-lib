import { Connection, Message } from "../../src/";
import log from "../../src/log";
import config from "../config";

export const scheduler = async () => {
    const mockMessage = {
        message: "remove_data_task",
    };

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

    const message = new Message(mockMessage, { persistent: true });

    await message.send(queue);
    log.debug("sent task by scheduler: " + JSON.stringify(message.getContent(), null, 2));

    setTimeout(async () => {
        // await connection.close();
    }, 500);
};
