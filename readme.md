# ts-easy-voicemeeter-remote

ts-easy-voicemeeter-remote is a Node.js typescript wrapper for the official voicemeeterRemote DLL available in the installation directory of [Voicemeeter][voicemeeter], [Voicemeeter banana][voicemeeter-banana], or [Voicemeeter potato][voicemeeter-potato]. More informations about the DLL is available [here](https://forum.vb-audio.com/viewtopic.php?f=8&t=346)

### First install it

```sh
npm install ts-easy-voicemeeter-remote --save
```

### How to use it ?

```ts
import VoiceMeeter from "easy-voicemeeter-remote";

const voicemeeter = new VoiceMeeter();

voicemeeter.init().then(() => {
  voicemeeter.login();
});
```

After the login method is successful you can use all the methods to interact with the instance of VoiceMeeter

### Connect and disconnect with the Voicemeeter software

```ts
// Connect
voicemeeter.login();
// Disconnect
voicemeeter.logout();
```

### Set parameters like : 'mono', 'solo', 'mute', 'gain', 'gate', 'comp' for each Strip and Bus

```ts
// Set the gain of the first Strip to -10db
voicemeeter.setStripParameter("gain", 0, -10);
// Mute the second Bus
voicemeeter.setBusParameter("mute", 1, true);
```

### Get All available Parameters form all Strips and Buses. like : 'mono', 'solo', 'mute', 'gain', 'gate', 'comp' ...

```ts
console.log("getAllParameter  || ", await voicemeeter.getAllParameters());
```

### Get Multiple Parameters form Strips and Buses.

```ts
var data = await voicemeeter.getMultiParameter([
  { type: InterfaceType.strip, id: 0, getVals: ["mono", "Mute", "solo", "gain"] },
  { type: InterfaceType.bus, id: 0, getVals: ["mono", "mute", "gain"] },
]);

console.log("getMultiParameter  || ", data);

/* { strips: [ { type: 'strip', id: 0, mono: 0, mute: 0, solo: 0, gain: -10 } ], 
buses: [{ type: 'bus', id: 0, mono: 0, mute: 0, gain: -18.614171981811523 }]} */
```

### Get Current Level

- Get Level by Strip or Bus ID
- mode = 0= pre fader input levels. 1= post fader input levels. 2= post Mute input levels. 3= output levels.
- index strip or bus id

```ts
voicemeeter.getLevelByID(mode, index);

console.log("Level || ", voicemeeter.getLevelByID(3, 6));
```

### Get Midi Data

```ts
voicemeeter.getMidi();

console.log("MIDI || ", voicemeeter.getMidi());
```

### Get all input/output devices

```ts
// Get all devices from the DLL
// They will be stored into an array in the voicemeeter-remote instance
voicemeeter.updateDeviceList();
// Get input devices
console.log(voicemeeter.inputDevices);
// Get output devices
console.log(voicemeeter.outputDevices);
```

#### Dependencies

[`ffi-napi`][ffi] => Read and execute the VoicemeeterRemote DLL

[`ref-napi`][ref-napi] => Turn Buffer instances into "pointers"

[`ref-array-napi`][ref-array] => Create array (\*pointer) for `ffi` to return string from the DLL

[`winreg`][winreg] => Read the windows registery to find Voicemeeter installation folder and the DLL

---

#### Base [mikatux/voicemeeter-remote](https://github.com/Mikatux/voicemeeter-remote)

#### [weeryan17/voicemeeter-remote](https://github.com/weeryan17/voicemeeter-remote) forked from [Mikatux/voicemeeter-remote](https://github.com/Mikatux/voicemeeter-remote)

#### [danielhands008/voicemeeter-remote-potato-napi](https://github.com/DanielHands008/voicemeeter-remote-potato-napi) forked from [weeryan17/voicemeeter-remote](https://github.com/weeryan17/voicemeeter-remote)

#### [steffenreimann/easy-voicemeeter-remote](https://github.com/steffenreimann/easy-voicemeeter-remote) forked from [DanielHands008/voicemeeter-remote-potato-napi](https://github.com/DanielHands008/voicemeeter-remote-potato-napi)

#### [jaggernaut555/ts-easy-voicemeeter-remote](https://github.com/jaggernaut555/ts-easy-voicemeeter-remote) forked from [steffenreimann/easy-voicemeeter-remote](https://github.com/steffenreimann/easy-voicemeeter-remote)

# License

MIT

[voicemeeter]: https://www.vb-audio.com/Voicemeeter/index.htm
[voicemeeter-banana]: https://www.vb-audio.com/Voicemeeter/banana.htm
[voicemeeter-potato]: https://www.vb-audio.com/Voicemeeter/potato.htm
[voicemeeter-api]: https://github.com/Mikatux/voicemeeter-api
[ffi]: https://www.npmjs.com/package/ffi-napi
[ref-napi]: https://www.npmjs.com/package/ref-napi
[ref-array]: https://www.npmjs.com/package/ref-array
[winreg]: https://www.npmjs.com/package/winreg
