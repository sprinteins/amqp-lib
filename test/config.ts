export default {
    messagebrokerpassword: process.env.RABBITMQ_DEFAULT_PASS || "test",
    messagebrokerurl: process.env.RABBITMQ_URL || "amqp://localhost",
    messagebrokerusername: process.env.RABBITMQ_DEFAULT_USER || "test",
};
