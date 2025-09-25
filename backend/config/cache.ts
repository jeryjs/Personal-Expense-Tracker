import NodeCache from 'node-cache';

// TTL in seconds
const TTL = {
    SHORT: 300, // 5 mins
    MEDIUM: 1800, // 30 mins
    LONG: 7200, // 2 hours
    EXTENDED: 86400, // 24 hours
};

const cache = new NodeCache({
    stdTTL: 120,
    checkperiod: 240,
});

export { cache, TTL };