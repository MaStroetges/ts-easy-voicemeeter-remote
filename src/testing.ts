import {voicemeeter} from './index.js';
import {InterfaceType} from './voicemeeterUtils.js';


async function start() {
  try {
    const vm = new voicemeeter();
    await vm.init();
    // Login into Voicemeeter
    vm.login();

    // Update Device List
    vm.updateDeviceList();

    // Get Voicemeeter Info  return { name: 'Voicemeeter Potato', index: 3, version: '3.0.0.8' }
    console.log('Voicemeeter Info', vm.getVoicemeeterInfo());

    const test = await vm.getMultiParameter([
      {type: InterfaceType.strip, id: 0, getVals: ['mono', 'Mute', 'solo', 'gain']},
      {type: InterfaceType.bus, id: 0, getVals: ['Mono', 'mute', 'gain']},
    ]);
    console.log(test);

    vm.setStripParameter('B1', 1, true);

    setInterval(() => {
      if (vm.isParametersDirty()) {
        Loop(vm);
      }
    }, 500);
  } catch (e) {
    console.log(e);
  }
}

start();

async function Loop(vm: voicemeeter) {
  console.log('MIDI', ' || ', vm.getMidi());
  console.log('Level', ' || ', vm.getLevelByID(3, 6));
  console.log('getAllParameter  || ', await vm.getAllParameter());
}
