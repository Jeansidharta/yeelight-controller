"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLampMethodValue = exports.parseLampMethodToLegibleName = void 0;
const NameLegibilityTable = {
    'bright': 'bright',
    'color_mode': 'colorMode',
    'ct': 'colorTemperature',
    'fw_ver': 'firmwareVersion',
    'hue': 'hue',
    'id': 'id',
    'model': 'model',
    'name': 'name',
    'power': 'isPowerOn',
    'rgb': 'rgb',
    'sat': 'saturation',
    'support': 'supportedMethods',
};
const ValueParsingTable = {
    'bright': (val) => Number(val),
    'color_mode': (val) => {
        if (val === 1)
            return 'rgb';
        else if (val === 2)
            return 'temperature';
        else
            return 'hsv';
    },
    'ct': (val) => Number(val),
    'fw_ver': (val) => val,
    'hue': (val) => Number(val),
    'id': (val) => {
        if (typeof val === 'string') {
            return parseInt(val.substr(2), 16);
        }
        else {
            return Number(val);
        }
    },
    'model': (val) => val,
    'name': (val) => val,
    'power': (val) => val === 'on',
    'rgb': (val) => Number(val),
    'sat': (val) => Number(val),
    'support': (val) => val.split(' '),
};
function parseLampMethodToLegibleName(method) {
    return NameLegibilityTable[method];
}
exports.parseLampMethodToLegibleName = parseLampMethodToLegibleName;
function parseLampMethodValue(method, value) {
    return ValueParsingTable[method](value);
}
exports.parseLampMethodValue = parseLampMethodValue;
