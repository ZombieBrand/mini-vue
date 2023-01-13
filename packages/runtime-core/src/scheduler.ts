const queue: any = [];
const activePreFlushCbs: any[] = []
let isFlusPending = false;
const p = Promise.resolve();

export const nextTick = (fn?) => {
    return fn ? p.then(fn) : p;
};

export const queueJobs = (job: any) => {
    if (!queue.includes(job)) {
        queue.push(job);
    }
    queueFlush();
};

export function queuePreFlushCb(job) {
    activePreFlushCbs.push(job)
    flushJobs()
}

function queueFlush() {
    if (isFlusPending) return;
    isFlusPending = true;
    nextTick(flushJobs);
}

function flushJobs() {
    isFlusPending = false;
    flushPreFlushCbs();

    let job;
    while ((job = queue.shift())) {
        job && job();
    }
}

function flushPreFlushCbs() {
    for (let i = 0; i < activePreFlushCbs.length; i++) {
        activePreFlushCbs[i]();
    }
}

