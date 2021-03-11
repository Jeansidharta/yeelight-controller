"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LampMethod = exports.MusicAction = exports.ControlFlowAction = exports.PowerMode = void 0;
/**
* Defines to what mode the lamp will switch to.
*/
var PowerMode;
(function (PowerMode) {
    PowerMode[PowerMode["Normal"] = 0] = "Normal";
    PowerMode[PowerMode["TurnOnAndSwitchToCT"] = 1] = "TurnOnAndSwitchToCT";
    PowerMode[PowerMode["TurnOnAndSwitchToRGB"] = 2] = "TurnOnAndSwitchToRGB";
    PowerMode[PowerMode["TurnOnAndSwitchToHSV"] = 3] = "TurnOnAndSwitchToHSV";
    PowerMode[PowerMode["TurnOnAndSwitchToFlow"] = 4] = "TurnOnAndSwitchToFlow";
    PowerMode[PowerMode["TurnOnAndSwitchToNightLight"] = 5] = "TurnOnAndSwitchToNightLight";
})(PowerMode = exports.PowerMode || (exports.PowerMode = {}));
/**
* The number used to define what happens after a control flow is done. It's used in the "start_cf" method
* - **RecoverState** (0): smart LED recover to the state before the color flow started.
* - **StayState** (1): smart LED stay at the state when the flow is stopped.
* - **TurnOff** (2): turn off the smart LED after the flow is stopped.
*/
var ControlFlowAction;
(function (ControlFlowAction) {
    ControlFlowAction[ControlFlowAction["RecoverState"] = 0] = "RecoverState";
    ControlFlowAction[ControlFlowAction["StayState"] = 1] = "StayState";
    ControlFlowAction[ControlFlowAction["TurnOff"] = 2] = "TurnOff";
})(ControlFlowAction = exports.ControlFlowAction || (exports.ControlFlowAction = {}));
/** Used in "set_music". Tell whether to turn the music mode on or off. */
var MusicAction;
(function (MusicAction) {
    MusicAction[MusicAction["off"] = 0] = "off";
    MusicAction[MusicAction["on"] = 1] = "on";
})(MusicAction = exports.MusicAction || (exports.MusicAction = {}));
class LampMethod {
    constructor() {
    }
    /**
    * This method is used to retrieve current property of smart LED.
    * The parameter is a list of property names and the response contains a list of corresponding property values. If the requested property name is not recognized by smart LED, then a empty string value ("") will be returned.
    */
    getProp(...props) {
        return {
            method: 'get_prop',
            params: props,
        };
    }
    /**
    * This method is used to change the color temperature of a smart LED
    *
    * @argument temperature The target color temperature. The type's range is 1700 ~ 6500 (k).
    * @argument effect How the effect happens.
    * @argument effectDuration The duration of the effect in milliseconds. Minimum is 30 milliseconds
    */
    setColorTemperatureAbx(temperature, effect, effectDuration) {
        if (temperature < 1700 || temperature > 6500)
            throw new Error('The temperature must be between 1700 and 6500');
        if (effectDuration < 30)
            throw new Error('The effectDuration must be at least 30');
        return {
            method: 'set_ct_abx',
            params: [temperature, effect, effectDuration],
        };
    }
    /**
    * This method is used to change the color of a smart LED.
    *
    * @argument rgbValue the target color. This value ranges from 0 to 16777215 (hex: 0xFFFFFF).
    * @argument effect How the effect happens.
    * @argument effectDuration The duration of the effect in milliseconds. Min is 30.
    */
    setRGB(rgbValue, effect, effectDuration) {
        if (rgbValue < 0 || rgbValue > 0xFFFFFF)
            throw new Error('The rgbValue must be between 0 and 0xFFFFFF');
        if (effectDuration < 30)
            throw new Error('The effectDuration must be at least 30');
        return {
            method: 'set_rgb',
            params: [rgbValue, effect, effectDuration],
        };
    }
    /**
    * This method is used to change the color of a smart LED.
    *
    * @argument hue The target hue. Min is 0, max is 359.
    * @argument saturation The target saturation. Min is 0, max is 100.
    * @argument effect How the effect happens.
    * @argument effectDuration The duration of the effect in milliseconds. Min is 30.
    */
    setHsv(hue, saturation, effect, effectDuration) {
        if (hue < 0 || hue > 359)
            throw new Error('The hue must be between 0 and 359');
        if (saturation < 0 || saturation > 100)
            throw new Error('The saturation must bet between 0 and 100');
        if (effectDuration < 30)
            throw new Error('The effectDuration must be at least 30');
        return {
            method: 'set_hsv',
            params: [hue, saturation, effect, effectDuration],
        };
    }
    /**
    * This method is used to change the brightness of a smart LED.
    *
    * @argument brightness The terget brightness. Min is 1, max is 100.
    * @argument effect How the effect happens.
    * @argument effectDuration The duration of the effect in milliseconds. Min is 30.
    */
    setBright(brightness, effect, effectDuration) {
        if (brightness < 1 || brightness > 100)
            throw new Error('The brightness must be between 1 and 100');
        if (effectDuration < 30)
            throw new Error('The effectDuration must be at least 30');
        return {
            method: 'set_bright',
            params: [brightness, effect, effectDuration],
        };
    }
    /**
    * This method is used to switch on or off the smart LED (software managed on/off).
    *
    * @argument power Either the lamp should be turned on or off.
    * @argument effect How the effect happens.
    * @argument effectDuration The duration of the effect in milliseconds. Min is 30.
    * @argument mode To what mode the lamp goes into when it turns on.
    */
    setPower(power, effect, effectDuration, mode = PowerMode.Normal) {
        if (effectDuration < 30)
            throw new Error('The effectDuration must be at least 30');
        return {
            method: 'set_power',
            params: [power, effect, effectDuration, mode],
        };
    }
    /**
    * This method is used to toggle the smart LED.
    * This method is defined because sometimes user may just want to flip the state
    * without knowing the current state.
    */
    toggle() {
        return {
            method: 'toggle',
            params: [],
        };
    }
    /**
    * This method is used to save current state of smart LED in persistent memory.
    * So if user powers off and then powers on the smart LED again (hard power reset),
    * the smart LED will show last saved state.
    *
    * For example, if user likes the current color (red) and brightness (50%)
    * and want to make this state as a default initial state (every time the smart LED is powered),
    * then he can use set_default to do a snapshot.
    */
    setDefault() {
        return {
            method: 'set_default',
            params: [],
        };
    }
    /**
    * This method is used to start a color flow. Color flow is a series of smart
    * LED visible state changing. It can be brightness changing, color changing or color
    * temperature changing.This is the most powerful command. All our recommended scenes,
    * e.g. Sunrise/Sunset effect is implemented using this method. With the flow expression, user
    * can actually "program" the light effect.
    *
    * Each visible state changing is defined to be a flow tuple that contains 4
    * elements: [duration, mode, value, brightness]. A flow expression is a series of flow tuples.
    * So for above request example, it means: change CT to 2700K & maximum brightness
    * gradually in 1000ms, then change color to red & 10% brightness gradually in 500ms, then
    * stay at this state for 5 seconds, then change CT to 5000K & minimum brightness gradually in
    * 500ms. After 4 changes reached, stopped the flow and power off the smart LED.
    *
    * Only accepted if the smart LED is currently in "on" state.
    *
    * @argument count The total number of visible state changing before color flow stopped.
    * 0 means infinite loop on the state changing.
    * @argument action The action taken after the flow is stopped.
    * @argument flowExpression The expression of the state changing series. The flowExpression
    * is an array of arrays of four elements. Each element represents: [duration, mode, value, brightness].
    * - **duration**: Gradual change time or sleep time, in milliseconds, minimum value 50.
    * - **mode**: 1 – color, 2 – color temperature, 7 – sleep.
    * - **value**: RGB value when mode is 1, CT value when mode is 2, Ignored when mode is 7.
    * - **brightness**: Brightness value, -1 or 1 ~ 100. Ignored when mode is 7. When
    * this value is -1, brightness in this tuple is ignored (only color or Color Temperature
    * change takes effect).
    */
    startControlFlow(count, action, flowExpression) {
        return {
            method: 'start_cf',
            params: [count, action, flowExpression.flat().join(',')],
        };
    }
    /**
    * This method is used to stop a running color flow.
    */
    stopControlFlow() {
        return {
            method: 'stop_cf',
            params: [],
        };
    }
    setScene(lampClass, val1, val2, val3) {
        if (val3 === undefined)
            return {
                method: 'set_scene',
                params: [lampClass, val1, val2],
            };
        else
            return {
                method: 'set_scene',
                params: [lampClass, val1, val2, val3],
            };
    }
    /**
    * This method is used to start a timer job on the smart LED. The job is to turn
    * the light off.
    *
    * For example, if a user wants to start a sleep timer (automatically turn
    * off the smart LED after 20 minutes), then he can send a
    * {"id":1,"method":"cron_add","params":[0, 20]}.
    *
    * Only accepted if the smart LED is currently in "on" state.
    *
    * @argument value The length of the timer (in minutes).
    */
    cronAdd(value) {
        return {
            method: 'cron_add',
            params: [0, value],
        };
    }
    /**
    * This method is used to retrieve the setting of the current cron job of the specified type.
    */
    cronGet() {
        return {
            method: 'cron_get',
            params: [],
        };
    }
    /**
    * This method is used to stop the specified cron job.
    */
    cronDel() {
        return {
            method: 'cron_del',
            params: [0],
        };
    }
    /**
    * This method is used to change brightness, Color Temperature or color of a smart
    * LED without knowing the current value, it's main used by controllers.
    *
    */
    setAdjust(control, prop) {
        return {
            method: 'set_adjust',
            params: [control, prop],
        };
    }
    /**
    * This method is used to start or stop music mode on a device. Under music mode,
    * no property will be reported and no message quota is checked.
    *
    * When control device wants to start music mode, it needs start a TCP
    * server firstly and then call "set_music" command to let the device know the IP and Port of the
    * TCP listen socket. After received the command, LED device will try to connect the specified
    * peer address. If the TCP connection can be established successfully, then control device could
    * send all supported commands through this channel without limit to simulate any music effect.
    * The control device can stop music mode by explicitly send a stop command or just by closing
    * the socket.
    *
    * @argument action Action of set_music command
    */
    async setMusic(action, serverIp, serverPort) {
        return {
            method: 'set_music',
            params: [action, serverIp, serverPort]
        };
    }
    /**
    * This method is used to name the device. The name will be stored on the
    * device and reported in discovering response. User can also read the name through "get_prop"
    * method.
    *
    * When using Yeelight official App, the device name is stored on cloud.
    * This method instead store the name on persistent memory of the device, so the two names
    * could be different.
    *
    * @argument name The name of the device.
    */
    setName(name) {
        return {
            method: 'set_name',
            params: [name],
        };
    }
    /**
    * This method is used to change the color of the background light.
    *
    * These commands are only supported on lights that are equipped with a background light.
    *
    * @argument rgbValue the target color. This value ranges from 0 to 16777215 (hex: 0xFFFFFF).
    * @argument effect How the effect happens.
    * @argument effectDuration The duration of the effect in milliseconds. Min is 30.
    */
    bgSetRGB(rgbValue, effect, effectDuration) {
        if (effectDuration < 30)
            throw new Error('The effectDuration must be at least 30');
        return {
            method: 'bg_set_rgb',
            params: [rgbValue, effect, effectDuration],
        };
    }
    /**
    * This method is used to change the color of the background light.
    *
    * These commands are only supported on lights that are equipped with a background light.
    *
    * @argument hue The target hue. Min is 0, max is 359.
    * @argument saturation The target saturation. Min is 0, max is 100.
    * @argument effect How the effect happens.
    * @argument effectDuration The duration of the effect in milliseconds. Min is 30.
    */
    bgSetHsv(hue, saturation, effect, effectDuration) {
        if (hue < 0 || hue > 359)
            throw new Error('The hue must be between 0 and 359');
        if (saturation < 0 || saturation > 100)
            throw new Error('The saturation must bet between 0 and 100');
        if (effectDuration < 30)
            throw new Error('The effectDuration must be at least 30');
        return {
            method: 'bg_set_hsv',
            params: [hue, saturation, effect, effectDuration],
        };
    }
    /**
    * This method is used to change the color temperature of a smart LED
    *
    * These commands are only supported on lights that are equipped with a background light.
    *
    * @argument temperature The target color temperature. The type's range is 1700 ~ 6500 (k).
    * @argument effect How the effect happens.
    * @argument effectDuration The duration of the effect in milliseconds. Minimum is 30 milliseconds
    */
    bgSetColorTemperatureAbx(temperature, effect, effectDuration) {
        if (temperature < 1700 || temperature > 6500)
            throw new Error('The temperature must be between 1700 and 6500');
        if (effectDuration < 30)
            throw new Error('The effectDuration must be at least 30');
        return {
            method: 'bg_set_ct_abx',
            params: [temperature, effect, effectDuration],
        };
    }
    /**
    * This method is used to start a color flow for the background light. Color flow is a series of smart
    * LED visible state changing. It can be brightness changing, color changing or color
    * temperature changing.This is the most powerful command. All our recommended scenes,
    * e.g. Sunrise/Sunset effect is implemented using this method. With the flow expression, user
    * can actually "program" the light effect.
    *
    * Each visible state changing is defined to be a flow tuple that contains 4
    * elements: [duration, mode, value, brightness]. A flow expression is a series of flow tuples.
    * So for above request example, it means: change CT to 2700K & maximum brightness
    * gradually in 1000ms, then change color to red & 10% brightness gradually in 500ms, then
    * stay at this state for 5 seconds, then change CT to 5000K & minimum brightness gradually in
    * 500ms. After 4 changes reached, stopped the flow and power off the smart LED.
    *
    * Only accepted if the smart LED is currently in "on" state.
    *
    * @argument count The total number of visible state changing before color flow stopped.
    * 0 means infinite loop on the state changing.
    * @argument action The action taken after the flow is stopped.
    * @argument flowExpression The expression of the state changing series. The flowExpression
    * is an array of arrays of four elements. Each element represents: [duration, mode, value, brightness].
    * - **duration**: Gradual change time or sleep time, in milliseconds, minimum value 50.
    * - **mode**: 1 – color, 2 – color temperature, 7 – sleep.
    * - **value**: RGB value when mode is 1, CT value when mode is 2, Ignored when mode is 7.
    * - **brightness**: Brightness value, -1 or 1 ~ 100. Ignored when mode is 7. When
    * this value is -1, brightness in this tuple is ignored (only color or Color Temperature
    * change takes effect).
    */
    bgStartControlFlow(count, action, flowExpression) {
        return {
            method: 'bg_start_cf',
            params: [count, action, flowExpression],
        };
    }
    /**
    * This method is used to stop a running color flow.
    */
    bgStopControlFlow() {
        return {
            method: 'bg_stop_cf',
            params: [],
        };
    }
    bgSetScene(lampClass, val1, val2, val3) {
        if (val3 === undefined) {
            return {
                method: 'bg_set_scene',
                params: [lampClass, val1, val2],
            };
        }
        else {
            return {
                method: 'bg_set_scene',
                params: [lampClass, val1, val2, val3],
            };
        }
    }
    /**
    * This method is used to save current state of background light in persistent memory.
    * So if user powers off and then powers on the background light again (hard power reset),
    * the background light will show last saved state.
    *
    * For example, if user likes the current color (red) and brightness (50%)
    * and want to make this state as a default initial state (every time the background light is powered),
    * then he can use set_default to do a snapshot.
    */
    bgSetDefault() {
        return {
            method: 'bg_set_default',
            params: [],
        };
    }
    /**
    * This method is used to switch on or off the background color (software managed on/off).
    *
    * @argument power Either the lamp should be turned on or off.
    * @argument effect How the effect happens.
    * @argument effectDuration The duration of the effect in milliseconds. Min is 30.
    * @argument mode To what mode the lamp goes into when it turns on.
    */
    bgSetPower(power, effect, effectDuration, mode = PowerMode.Normal) {
        if (effectDuration < 30)
            throw new Error('The effectDuration must be at least 30');
        return {
            method: 'bg_set_power',
            params: [power, effect, effectDuration, mode],
        };
    }
    /**
    * This method is used to change the brightness of a background color.
    *
    * @argument brightness The terget brightness. Min is 1, max is 100.
    * @argument effect How the effect happens.
    * @argument effectDuration The duration of the effect in milliseconds. Min is 30.
    */
    bgSetBright(brightness, effect, effectDuration) {
        if (brightness < 1 || brightness > 100)
            throw new Error('The brightness must be between 1 and 100');
        if (effectDuration < 30)
            throw new Error('The effectDuration must be at least 30');
        return {
            method: 'bg_set_bright',
            params: [brightness, effect, effectDuration],
        };
    }
    /**
    * This method is used to change brightness, Color Temperature or color of a background
    * light without knowing the current value, it's main used by controllers.
    */
    bgSetAdjust() {
        return {
            method: 'bg_set_adjust',
            params: [],
        };
    }
    /**
    * This method is used to toggle the background light.
    * This method is defined because sometimes user may just want to flip the state
    * without knowing the current state.
    */
    bgToggle() {
        return {
            method: 'bg_toggle',
            params: [],
        };
    }
    /**
    * This method is used to toggle the main light and background light at the same time.
    *
    * When there is main light and background light, “toggle” is used to toggle
    * main light, “bg_toggle” is used to toggle background light while “dev_toggle” is used to
    * toggle both light at the same time.
    */
    devToggle() {
        return {
            method: 'dev_toggle',
            params: [],
        };
    }
    /**
    * This method is used to adjust the brightness by specified percentage within specified duration.
    *
    * @argument percentage The percentage to be adjusted. The range is: -100 ~ 100
    * @argument duration The duration of the effect in milliseconds. Minimum is 30 milliseconds
    */
    adjustBright(percentage, duration) {
        if (percentage < -100 || percentage > 100)
            throw new Error('The percentage should be between -100 and 100.');
        if (duration < 30)
            throw new Error('The duration must be at least 30');
        return {
            method: 'adjust_bright',
            params: [percentage, duration],
        };
    }
    /**
    * This method is used to adjust the color temperature by specified percentage within specified duration.
    *
    * @argument percentage The percentage to be adjusted. The range is: -100 ~ 100
    * @argument duration The duration of the effect in milliseconds. Minimum is 30 milliseconds
    */
    adjustColorTemperature(percentage, duration) {
        if (percentage < -100 || percentage > 100)
            throw new Error('The percentage should be between -100 and 100.');
        if (duration < 30)
            throw new Error('The duration must be at least 30');
        return {
            method: 'adjust_ct',
            params: [percentage, duration],
        };
    }
    /**
    * This method is used to adjust the color within specified duration.
    *
    * The percentage parameter will be ignored and the color is internally defined and can’t specified.
    *
    * @argument percentage The percentage to be adjusted. The range is: -100 ~ 100
    * @argument duration The duration of the effect in milliseconds. Minimum is 30 milliseconds
    */
    adjustColor(percentage, duration) {
        if (percentage < -100 || percentage > 100)
            throw new Error('The percentage should be between -100 and 100.');
        if (duration < 30)
            throw new Error('The duration must be at least 30');
        return {
            method: 'adjust_color',
            params: [percentage, duration],
        };
    }
    /**
    * This method is used to adjust background light by specified percentage within specified duration.
    *
    * @argument percentage The percentage to be adjusted. The range is: -100 ~ 100
    * @argument duration The duration of the effect in milliseconds. Minimum is 30 milliseconds
    */
    bgAdjustBright(percentage, duration) {
        if (percentage < -100 || percentage > 100)
            throw new Error('The percentage should be between -100 and 100.');
        if (duration < 30)
            throw new Error('The duration must be at least 30');
        return {
            method: 'bg_adjust_bright',
            params: [percentage, duration],
        };
    }
    /**
    * This method is used to adjust background light by specified percentage within specified duration.
    *
    * @argument percentage The percentage to be adjusted. The range is: -100 ~ 100
    * @argument duration The duration of the effect in milliseconds. Minimum is 30 milliseconds
    */
    bgAdjustColorTemperature(percentage, duration) {
        if (percentage < -100 || percentage > 100)
            throw new Error('The percentage should be between -100 and 100.');
        if (duration < 30)
            throw new Error('The duration must be at least 30');
        return {
            method: 'bg_adjust_ct',
            params: [percentage, duration],
        };
    }
    /**
    * This method is used to adjust background light by specified percentage within specified duration.
    *
    * The percentage parameter will be ignored and the color is internally defined and can’t specified.
    *
    * @argument percentage The percentage to be adjusted. The range is: -100 ~ 100
    * @argument duration The duration of the effect in milliseconds. Minimum is 30 milliseconds
    */
    bgAdjustColor(percentage, duration) {
        if (percentage < -100 || percentage > 100)
            throw new Error('The percentage should be between -100 and 100.');
        if (duration < 30)
            throw new Error('The duration must be at least 30');
        return {
            method: 'bg_adjust_color',
            params: [percentage, duration],
        };
    }
}
exports.LampMethod = LampMethod;