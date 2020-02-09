import { listener } from "./listener";
import { sender } from "./sender";

export default async function run() {
    await Promise.all([sender(), listener()]);
}
