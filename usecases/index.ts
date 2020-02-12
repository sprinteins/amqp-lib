import pubSub from "./pub-sub/";
import topics from "./topics/";
import workers from "./workers/";

run();

async function run() {
    await pubSub();
    await workers();
    await topics();
}
