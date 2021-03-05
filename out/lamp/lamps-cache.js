"use strict";
/******************************************************************************/
/*                           What is this file?                               */
/*                                                                            */
/* This file has code that stores all lamp states that were discovered in the */
/* network.                                                                   */
/*                                                                            */
/******************************************************************************/
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLamp = exports.waitUntilHasLamp = exports.removeLamp = exports.getAllFoundLamps = exports.addOrUpdateLamp = exports.lamps = void 0;
const _1 = require(".");
exports.lamps = Object.create(null);
let lampsCount = 0;
const sleep = (time) => new Promise(resolve => setTimeout(resolve, time));
async function addOrUpdateLamp(lampInfo) {
    if (!exports.lamps[lampInfo.id]) {
        lampsCount++;
        const newLamp = await _1.Lamp.create(lampInfo);
        exports.lamps[lampInfo.id] = newLamp;
        newLamp.setLogLevel('results');
    }
}
exports.addOrUpdateLamp = addOrUpdateLamp;
function getAllFoundLamps() {
    return Object.values(exports.lamps);
}
exports.getAllFoundLamps = getAllFoundLamps;
function removeLamp(lampId) {
    if (exports.lamps[lampId])
        lampsCount--;
    exports.lamps[lampId]?.destroy();
    delete exports.lamps[lampId];
}
exports.removeLamp = removeLamp;
async function waitUntilHasLamp() {
    while (Object.values(exports.lamps).length === 0)
        await sleep(500);
}
exports.waitUntilHasLamp = waitUntilHasLamp;
function getLamp(lampId) {
    if (lampId)
        return exports.lamps[lampId];
    else
        return Object.values(exports.lamps)[Math.floor(Math.random() * lampsCount)];
}
exports.getLamp = getLamp;
