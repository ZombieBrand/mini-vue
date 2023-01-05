const queue: any = [];
let isFlusPending = false;
const p = Promise.resolve();

export const nextTick = (fn) => {
    return fn ? p.then(fn) : p;
};

export const queueJobs = (job: any) => {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
};
function queueFlush() {
    if (isFlusPending) return;
    isFlusPending = true;
    nextTick(flushJobs);
}

function flushJobs() {
    isFlusPending = false;
    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}
