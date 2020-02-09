import { scheduler } from "./scheduler";
import { worker } from "./worker";

export default async function run() {
    await Promise.all([scheduler(), worker()]);
}
