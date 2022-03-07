import { VoiceMeeterLoginError } from './errors.js';
import { VoiceMeeter, InterfaceType, VoiceMeeterType } from './index.js';

async function start() {
  try {
    let vm = new VoiceMeeter();
    await vm.init();
    // Login into Voicemeeter
    console.log(vm.testConnection());
    // if (!vm.testConnection()) {
    //   vm.runVoiceMeeter(VoiceMeeterType.voiceMeeterPotato);
    // }

    vm.login();

    console.log(vm.testConnection());

    console.debug('Before updateDeviceList');
    // Update Device List
    vm.updateDeviceList();

    console.debug('Before getVoiceMeeterInfo');
    // Get Voicemeeter Info  return { name: 'VoiceMeeter Potato', index: 3, version: '3.0.0.7' }
    console.debug('VoiceMeeter Info', vm.getVoiceMeeterInfo());

    console.debug('before getMultiParameter');
    const multiparam = await vm.getMultiParameter([
      { type: InterfaceType.strip, id: 0, getVals: ['name', 'mono', 'mute', 'solo', 'gain', 'GainLayer[0]', 'A1', 'Label', 'Device'] },
      { type: InterfaceType.bus, id: 0, getVals: ['mono', 'mute', 'gain', 'Sel'] },
    ]);
    console.log(multiparam);

    // vm.setStripParameter('B1',g 1, true);

    console.debug('before getMacroButtonStatus');
    let macroStatus = vm.getMacroButtonStatus(1);
    // vm.toggleMacroButtonStatus(1);
    console.log(macroStatus)

    // console.debug('before AllParameter');
    // let allparam = await vm.getAllParameter();
    // console.log(allparam);

    // console.debug('before GetStringParam')
    // let stringparam = await vm.getStringParameter('strip[0].gainLayer[0]');
    // console.log(stringparam);

    // setInterval(() => {
    //   if (vm.isParametersDirty()) {
    //     Loop(vm);
    //   }
    // }, 5000);
  } catch (e) {
    if (e instanceof VoiceMeeterLoginError) {
      console.log("login error");
    }
    else {
      console.log(e);
    }
  }
}

start();

async function Loop(vm: VoiceMeeter) {
  // console.log('MIDI', ' || ', vm.getMidi());
  // console.log('Level', ' || ', vm.getLevelByID(3, 6));
  console.log('getAllParameter  || ', await vm.getAllParameters());
}
