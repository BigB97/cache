const express = require('express');
const fetch = require('node-fetch');
const responseTime = require("response-time");
const redis = require("redis");
const {
    promisify
} = require('util');

const port = process.env.PORT || 3000;
const redis_port = process.env.PORT || 6379;

const app = express()
app.use(responseTime());

const client = redis.createClient(redis_port)

const GET_ASYNC = promisify(client.get).bind(client)
const SET_ASYNC = promisify(client.set).bind(client)

async function mrRocket(req, res, next) {
    const findCached = await GET_ASYNC("rockets")
    if (findCached) {
        console.log("Using Cached info");
        return res.send(JSON.parse(findCached));
    }
    next()
}
app.get('/rockets', mrRocket, async (req, res) => {
    try {
        const response = await fetch("https://api.spacexdata.com/v3/rockets")
        const data = await response.json()
        const saveCache = await SET_ASYNC("rockets", JSON.stringify(data), "EX", 1800)
        console.log("new data cached", saveCache);
        res.send(data);
    } catch (error) {
        res.send(error);
    }
});

app.listen(port, () => {
    console.log(`Server started on port`);
});