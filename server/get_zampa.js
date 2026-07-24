const mongoose = require('mongoose');
const Player = require('./models/Player');
require('dotenv').config();

async function getZampa() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const player = await Player.findOne({ name: "Adam Zampa" });
        if (player) {
            console.log("Adam Zampa Found:");
            console.log(JSON.stringify(player, null, 2));
        } else {
            console.log("Adam Zampa NOT FOUND");
        }
        mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

getZampa();
