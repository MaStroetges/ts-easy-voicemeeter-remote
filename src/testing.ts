import voicemeeter from './index.js';


async function start() {
    try {
        let vm = new voicemeeter();
        await vm.init();
        //Login into Voicemeeter
        vm.login();

        //Update Device List 
        vm.updateDeviceList();

        // Get Voicemeeter Info  return { name: 'VoiceMeeter Potato', index: 3, version: '3.0.0.8' }
        console.log('VoiceMeeter Info', vm.getVoicemeeterInfo());


        var test = await vm.getMultiParameter([
            { type: 'StRip', id: 0, getVals: ['mono', 'Mute', 'solo', 'gain'] },
            { type: 'Bus', id: 0, getVals: ['Mono', 'mute', 'gain'] }
        ])
        console.log(test)

        vm.setStripParameter("A5", 2, true);

        setInterval(() => {
            if (vm.isParametersDirty()) {
                Loop(vm)
            }
        }, 500)
    } catch (e) {
        console.log(e)
    }
}



start();


async function Loop(vm: voicemeeter) {
    console.log("loopin");
    console.log('MIDI', ' || ', vm.getMidi())
    console.log('Level', ' || ', vm.getLevelByID(3, 6))
    console.log('getAllParameter  || ', await vm.getAllParameter())
}