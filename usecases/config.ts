export default {
    messagebrokerurl: process.env.RABBIT_URL
        ? process.env.RABBIT_URL
        : "amqp://localhost",
};
