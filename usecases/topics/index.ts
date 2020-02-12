import { listener } from "./listener";
import { sender } from "./sender";

export default async function run() {
    await listener();
    await sender();
}
