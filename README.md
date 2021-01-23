# Yeelight lights controller

This project is a controller for Yeelight's Smart Lights. It was developed to control my own lights in my own house. The project operates using the [Yeelight's local API](https://www.yeelight.com/en_US/developer).

## How it works

The lamp's protocol is based on [SSDP](https://en.wikipedia.org/wiki/Simple_Service_Discovery_Protocol). If you know about this protocol, then you can skip the "Finding all lights" chapter.

Also, for this to work, you need to turn your light's LAN control (more info [here](https://www.yeelight.com/faqs/lan_control)).

### Finding smart lights on the network

If you want to know about what lamps are connected to your network, you must first broadcast a DISCOVERY REQUEST message to the network. After broadcasting, the lamps that receive this message will respond with a unicast DISCOVERY RESPONSE message containing the lamp's IP address and ID number.

Also, lamps will periodically broadcast ADVERTISEMENT messages to the network, notifying that the lamp is connected to the network. The first message is send at the moment the lamp is connectted to the network.

#### DISCOVERY REQUEST MESSAGE

The discovery request message must be exactly like this:
```
M-SEARCH * HTTP/1.1
MAN: "ssdp:discover"
ST: wifi_bulb'
```
Note: The line breaks **MUST** be "\r\n".

The message must be sent as a UDP packet to the multicast IP address **239.255.255.250**, port **1982**. The message can have any *source port*, but that is the port that will receive the DISCOVERY RESPONSE messages.

#### DISCOVERY RESPONSE MESSAGE

The discovery response messages looks something like this:
```
HTTP/1.1 200 OK
Cache-Control: max-age=3600
Date:
Ext:
Location: yeelight://192.168.1.239:55443
Server: POSIX UPnP/1.0 YGLC/1
id: 0x000000000015243f
model: color
fw_ver: 18
support: get_prop set_default set_power toggle set_bright start_cf stop_cf set_scene
cron_add cron_get cron_del set_ct_abx set_rgb
power: on
bright: 100
color_mode: 2
ct: 4000
rgb: 16711680
hue: 100
sat: 35
name: my-light-name
```
Note: The line breaks are always "\r\n".

#### ADVERTISEMENT MESSAGE

The advertisement message looks something like this:
```
NOTIFY * HTTP/1.1
Cache-Control: max-age=3600
Date:
Ext:
Location: yeelight://192.168.1.239:55443
Server: POSIX UPnP/1.0 YGLC/1
id: 0x000000000015243f
model: color
fw_ver: 18
support: get_prop set_default set_power toggle set_bright start_cf stop_cf set_scene
cron_add cron_get cron_del set_ct_abx set_rgb
power: on
bright: 100
color_mode: 2
ct: 4000
rgb: 16711680
hue: 100
sat: 35
name: my-light-name
```
Note: The line breaks are always "\r\n".

Advertisement messages are periodically broadcasted by lamps to the network, to the address **239.255.255.250**, port **1982**.

### Sending commands to a light

After knowing a lamp's IP address and ID number, you can create TCP connections to send commands to the lamp. The connection must be on port **55443**.

After connecting to the lamp, you can start sending commands to it. A command has the following format:

```
{ "id": 123, "method": "method_name", "params": [param1, param2, param3, ..., paramN]}\r\n
```

Note that the message format is JSON, and the string must end with "\r\n". The message contains the following items:

- **id**: The ID number of the lamp, accquired by reading either the DISCOVERY RESPONSE message or the ADVERTISEMENT message.
- **method**: Them method to execute in the lamp. The supported methods are sent by the lamp in both SSDP messages.
- **params**: An array of arguments that will be passed to the lamp.

## Running this project

### Prerequisites

You must have node.js and npm installed, preferably in the latest version. you must also not be running in a virtual environment (like a virtual machine, docker continer or WSL). This last requirement is because the discovery protocol of the lamps uses IPv4 multicast addresses, which (for some reason) don't work very well from virtual environments.

### Running

After cloning this project, you must run `npm install` in the root of the project. After this finishes, just running `npm run start` should start the program up.