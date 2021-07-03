import ffi from 'ffi-napi';
import Registry from 'winreg';
import ref from 'ref-napi';
import ArrayType from 'ref-array-napi';
import vmChannels from './vmChannels';
import ioFuncs from './ioFuncs';
import { VoicemeeterDefaultConfig, VoicemeeterType, InterfaceType, voicemeeterIO, ioChannels, voicemeeterConfig } from './voicemeeterUtils';
const CharArray = ArrayType<number>(ref.types.char);
const LongArray = ArrayType(ref.types.long);
const FloatArray = ArrayType(ref.types.float);

async function getDLLPath() {
  const regKey = new Registry({
    hive: Registry.HKLM,
    key: '\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\VB:Voicemeeter {17359A74-1236-5467}'
  });
  return new Promise(resolve => {
    regKey.values((err, items) => {
      const uninstallerPath = items.find(i => i.name === 'UninstallString')?.value;
      if (!uninstallerPath) {
        throw new Error("Could not find Voicemeeter installation path");
      }
      const fileNameIndex = uninstallerPath.lastIndexOf('\\');
      resolve(uninstallerPath.slice(0, fileNameIndex));
    });
  });
}

// const isEmpty = function (object) {
//   for (let key in object) {
//     if (object.hasOwnProperty(key))
//       return false;
//   }
//   return true;
// };

interface VoiceMeeterLibrary {
  VBVMR_Login(): string | number
  VBVMR_Logout(): string | number
  VBVMR_RunVoicemeeter(voicemeeterType: number): string | number

  // typePtr: LongArray
  VBVMR_GetVoicemeeterType(typePtr: ref.Pointer<string | number>): string | number
  // typePtr: LongArray
  VBVMR_GetVoicemeeterVersion(typePtr: ref.Pointer<string | number>): string | number

  VBVMR_IsParametersDirty(): string | number
  // hardwareIdPtr: CharArracy
  // namePtr: FloatArray
  VBVMR_GetParameterFloat(hardwareIdPtr: Buffer, namePtr: ref.Pointer<number>): string | number
  // VBVMR_GetParameterStringA(): bigint

  // script: CharArray
  VBVMR_SetParameters(script: ArrayType<unknown>): string | number
  VBVMR_Output_GetDeviceNumber(): string | number
  // typePtr: LongArray
  // namePtr: CharArray
  // hardwareIdPtr: CharArracy
  VBVMR_Output_GetDeviceDescA(deviceId: string | number, typePtr: ref.Pointer<string | number>, namePtr: Buffer, hardwareIdPtr: Buffer): string | number
  VBVMR_Input_GetDeviceNumber(): string | number
  // typePtr: LongArray
  // namePtr: CharArray
  // hardwareIdPtr: CharArracy
  VBVMR_Input_GetDeviceDescA(deviceId: string | number, typePtr: ref.Pointer<string | number>, namePtr: Buffer, hardwareIdPtr: Buffer): string | number

  // value: ref.alloc('float');
  VBVMR_GetLevel(type: string | number, channel: string | number, value: ref.Pointer<number>): string | number
  // buffer: new Buffer(1024);
  VBVMR_GetMidiMessage(buffer: Buffer, size: string | number): string | number
}

interface deviceInfo {
  name: string,
  hardwareId: string,
  type: number | string
}

interface inParam {
  type: string,
  id: number,
  getVals: string[]
}

interface outParam {
  // replace this index
  [index: string]:any,
  type: string,
  id: number,
}

let libvoicemeeter: VoiceMeeterLibrary;

const voicemeeter = {
  isConnected: false,
  isInitialised: false,
  outputDevices: <deviceInfo[]>[],
  inputDevices: <deviceInfo[]>[],
  channels: vmChannels,
  type: VoicemeeterType.unknown,
  version: "",
  voicemeeterConfig: voicemeeterConfig,
  async init() {
    console.debug(await getDLLPath() + '/VoicemeeterRemote64.dll');
    libvoicemeeter = ffi.Library(await getDLLPath() + '/VoicemeeterRemote64.dll', {
      'VBVMR_Login': ['long', []],
      'VBVMR_Logout': ['long', []],
      'VBVMR_RunVoicemeeter': ['long', ['long']],

      'VBVMR_GetVoicemeeterType': ['long', ['long *']],
      'VBVMR_GetVoicemeeterVersion': ['long', ['long *']],

      'VBVMR_IsParametersDirty': ['long', []],
      'VBVMR_GetParameterFloat': ['long', [CharArray, 'float *']],
      'VBVMR_GetParameterStringA': ['long', [CharArray, CharArray]],

      'VBVMR_SetParameters': ['long', [CharArray]],
      'VBVMR_Output_GetDeviceNumber': ['long', []],
      'VBVMR_Output_GetDeviceDescA': ['long', ['long', 'long *', CharArray, CharArray]],
      'VBVMR_Input_GetDeviceNumber': ['long', []],
      'VBVMR_Input_GetDeviceDescA': ['long', ['long', 'long *', CharArray, CharArray]],
      'VBVMR_GetLevel': ['long', ['long', 'long', 'float *']],
      'VBVMR_GetMidiMessage': ['long', ['pointer', 'long']],
    });
    this.isInitialised = true;
  },

  runvoicemeeter(voicemeeterType: number) {
    if (libvoicemeeter.VBVMR_RunVoicemeeter(voicemeeterType) === 0) {
      return;
    }
    throw "running failed";
  },
  isParametersDirty() {
    return libvoicemeeter.VBVMR_IsParametersDirty();
  },
  getParameter(parameterName: string) {
    if (!this.isConnected) {
      throw "Not connected ";
    }
    var hardwareIdPtr = Buffer.alloc(parameterName.length + 1);
    hardwareIdPtr.write(parameterName);
    var namePtr = ref.alloc(ref.types.float).ref();
    libvoicemeeter.VBVMR_GetParameterFloat(hardwareIdPtr, namePtr);
    return namePtr[0]
  },
  _getVoicemeeterType() {
    let typePtr: ref.Pointer<string | number> = ref.alloc(ref.types.long).ref();

    if (libvoicemeeter.VBVMR_GetVoicemeeterType(typePtr) !== 0) {
      throw "running failed";
    }

    switch (typePtr[0]) {
      case 1: // Voicemeeter software
        return VoicemeeterType.voicemeeter;
      case 2: // Voicemeeter Banana software
        return VoicemeeterType.voicemeeterBanana;
      case 3:
        return VoicemeeterType.voicemetterPotato;
      default: // unknown software
        return VoicemeeterType.unknown
    }
  },
  // This function is returning the incomplete version
  _getVoicemeeterVersion() {
    // Pointer on 32bit integer receiving the version (v1.v2.v3.v4)
		// 				v1 = (version & 0xFF000000)>>24;
		// 				v2 = (version & 0x00FF0000)>>16;
		// 				v3 = (version & 0x0000FF00)>>8;
		// 				v4 = version & 0x000000FF;
    var versionPtr = ref.alloc(ref.types.long).ref();
    if (libvoicemeeter.VBVMR_GetVoicemeeterVersion(versionPtr) !== 0) {
      throw "running failed";
    }

    // return value is `7`, should be `117440519`
    // console.debug(versionPtr[0]);

    const v4 = versionPtr[0] % Math.pow(2, 8);
    const v3 = (versionPtr[0] - v4) % Math.pow(2, 16) / Math.pow(2, 8);
    const v2 = ((versionPtr[0] - v3 * 256 - v4) % Math.pow(2, 24)) / Math.pow(2, 16);
    const v1 = (versionPtr[0] - v2 * 512 - v3 * 256 - v4) / Math.pow(2, 24);

    return `${v1}.${v2}.${v3}.${v4}`;
  },
  login() {
    if (!this.isInitialised) {
      throw "await the initialisation before login";
    }
    if (this.isConnected) {
      return;
    }
    if (libvoicemeeter.VBVMR_Login() === 0) {
      this.isConnected = true;
      this.type = this._getVoicemeeterType();
      this.version = this._getVoicemeeterVersion();
      this.voicemeeterConfig = VoicemeeterDefaultConfig[this.type];
      return;
    }
    this.isConnected = false;
    throw "Connection failed";
  },
  logout() {
    if (!this.isConnected) {
      throw "Not connected";
    }
    if (libvoicemeeter.VBVMR_Logout() === 0) {
      this.isConnected = false;
      return;
    }
    throw "Logout failed";
  },
  updateDeviceList() {
    if (!this.isConnected) {
      throw "Not connected ";
    }

    this.outputDevices = [];
    this.inputDevices = [];
    const outputDeviceNumber = libvoicemeeter.VBVMR_Output_GetDeviceNumber();
    for (let i = 0; i < outputDeviceNumber; i++) {
      let typePtr: ref.Pointer<string | number> = ref.alloc(ref.types.long).ref();
      let namePtr = Buffer.alloc(256);
      let hardwareIdPtr = Buffer.alloc(256);
      
      if (libvoicemeeter.VBVMR_Output_GetDeviceDescA(i, typePtr, namePtr, hardwareIdPtr) !== 0) {
        throw new Error("Error getting output device")
      }

      this.outputDevices.push({
        name: namePtr.toString().replace(/\x00+$/g, ''),
        hardwareId: hardwareIdPtr.toString().replace(/\x00+$/g, ''),
        type: typePtr[0]
      })
    }

    const inputDeviceNumber = libvoicemeeter.VBVMR_Input_GetDeviceNumber();
    for (let i = 0; i < inputDeviceNumber; i++) {
      let typePtr: ref.Pointer<string | number> = ref.alloc(ref.types.long).ref();
      let namePtr = Buffer.alloc(256);
      let hardwareIdPtr = Buffer.alloc(256);

      if (libvoicemeeter.VBVMR_Input_GetDeviceDescA(i, typePtr, namePtr, hardwareIdPtr) !== 0) {
        throw new Error("Error getting output device")
      }
      
      this.inputDevices.push({
        name: namePtr.toString().replace(/\x00+$/g, ''),
        hardwareId: hardwareIdPtr.toString().replace(/\x00+$/g, ''),
        type: typePtr[0]
      })
    }
  },

  // _sendRawParameterScript(scriptString) {
  //   const script = new Buffer.alloc(scriptString.length + 1);
  //   script.fill(0);
  //   script.write(scriptString);
  //   return libvoicemeeter.VBVMR_SetParameters(script);
  // },
  // _setParameter(type, name, id, value) {

  //   if (!this.isConnected) {
  //     throw "Not connected ";
  //   }
  //   if (!this.voicemeeterConfig || isEmpty(this.voicemeeterConfig)) {
  //     throw "Configuration error  ";
  //   }
  //   const interfaceType = type === InterfaceType.strip ? 'Strip' : 'Bus';
  //   const voicemeeterConfigObject = type === InterfaceType.strip ? 'strips' : 'buses';

  //   if (this.voicemeeterConfig[voicemeeterConfigObject].findIndex(strip => strip.id === id) === -1) {
  //     throw `${interfaceType} ${id} not found`;
  //   }

  //   return this._sendRawParaneterScript(`${interfaceType}[${id}].${name}=${value};`);
  // },
  // _setParameters(parameters) {

  //   if (!this.isConnected) {
  //     throw "Not connected ";
  //   }
  //   if (!this.voicemeeterConfig || isEmpty(this.voicemeeterConfig)) {
  //     throw "Configuration error  ";
  //   }

  //   if (!Array.isArray(parameters)) {
  //     throw interfaceType + " not found";
  //   }

  //   const script = parameters.map(p => {
  //     const interfaceType = p.type === InterfaceType.strip ? 'Strip' : 'Bus';
  //     const voicemeeterConfigObject = p.type === InterfaceType.strip ? 'strips' : 'buses';

  //     if (!this.voicemeeterConfig[voicemeeterConfigObject].find(strip => strip.id === p.id)) {
  //       throw interfaceType + " not found";
  //     }
  //     return `${interfaceType}[${p.id}].${p.name}=${p.value};`;
  //   }).join('\n');

  //   return this._sendRawParaneterScript(script);

  // },
  getLevel(type: number, channel: number | undefined) {
    // TODO: rethink this
    if (!channel) {
      return;
    }
    const value = ref.alloc(ref.types.float).ref();
    handle(libvoicemeeter.VBVMR_GetLevel(type, channel, value));
    return 20 * Math.log10(value[0]) + 60;
  },
  getMidi() {

    const buffer = Buffer.alloc(1024);
    handle(libvoicemeeter.VBVMR_GetMidiMessage(buffer, 1024));
    const unorg = Uint8Array.from(buffer);;
    const org = [];
    for (let i = 0; i < unorg.length; i += 3) if (unorg[i]) org.push([unorg[i], unorg[i + 1], unorg[i + 2]]);
    return org;
  },
  getLevelByID(m:number, index:number) {
    var mode = m || 0
    index = index || 0
    var out: ioChannels = {}
    var vmType = this._getVoicemeeterType()
    var vmChannelsByType = vmChannels[vmType]
    if (!vmChannelsByType) {
      throw new Error("Invalid voicemeeter type");
    }
    //console.log(vmType)
    //console.log(vmChannels)
    //console.log(vmChannelsByType)
    if (mode == 3) {
      var outChannels = vmChannelsByType.outputs[index]
      out.l = voicemeeter.getLevel(mode, outChannels.l)
      out.r = voicemeeter.getLevel(mode, outChannels.r)
      out.fc = voicemeeter.getLevel(mode, outChannels.fc)
      out.lfe = voicemeeter.getLevel(mode, outChannels.lfe)
      out.sl = voicemeeter.getLevel(mode, outChannels.sl)
      out.sr = voicemeeter.getLevel(mode, outChannels.sr)
      out.bl = voicemeeter.getLevel(mode, outChannels.bl)
      out.br = voicemeeter.getLevel(mode, outChannels.br)
      return out
    } else if (mode == 0 || 1 || 2) {
      var inChannels = vmChannelsByType.inputs[index]
      var inputs = voicemeeter.voicemeeterConfig.strips
      if (inputs[index].isVirtual) {
        out.l = voicemeeter.getLevel(mode, inChannels.l)
        out.r = voicemeeter.getLevel(mode, inChannels.r)
        out.fc = voicemeeter.getLevel(mode, inChannels.fc)
        out.lfe = voicemeeter.getLevel(mode, inChannels.lfe)
        out.sl = voicemeeter.getLevel(mode, inChannels.sl)
        out.sr = voicemeeter.getLevel(mode, inChannels.sr)
        out.bl = voicemeeter.getLevel(mode, inChannels.bl)
        out.br = voicemeeter.getLevel(mode, inChannels.br)
      } else {
        out.l = voicemeeter.getLevel(mode, inChannels.l)
        out.r = voicemeeter.getLevel(mode, inChannels.r)
      }
      return out
    }
  },
  // async getAllParameter() {
  //   return new Promise((resolve, rejects) => {
  //     var data = { inputs: [], outputs: [] }

  //     voicemeeter.voicemeeterConfig.strips.forEach(element => {
  //       var out = element
  //       for (var funcName in ioFuncs.strip) {
  //         var func = ioFuncs.strip[funcName]
  //         out[func.out] = voicemeeter.getParameter(`Strip[${element.id}].${func.val}`)
  //       }
  //       data.inputs.push(out)
  //     });

  //     voicemeeter.voicemeeterConfig.buses.forEach(element => {
  //       var out = element
  //       for (var funcName in ioFuncs.bus) {
  //         var func = ioFuncs.bus[funcName]
  //         out[func.out] = voicemeeter.getParameter(`Bus[${element.id}].${func.val}`)
  //       }
  //       data.outputs.push(out)
  //     });
  //     resolve(data)
  //   });
  // },
  async getMultiParameter(param: inParam[]) {
    return new Promise((resolve, rejects) => {
      var data = {
        strips: <outParam[]>[],
        buses: <outParam[]>[]
      }

      param.forEach(paramElement => {
        var out:outParam = {
          type: paramElement.type.toLowerCase(),
          id: paramElement.id
        }
        if (paramElement.type.toLowerCase() == 'strip' || 'bus') {
          paramElement.getVals.forEach(element => {
            try {
              var func = ioFuncs[paramElement.type.toLowerCase()][element.toLowerCase()]
              ///console.log(paramElement)
              //console.log(element)
              //console.log(func)
              out[func.out] = voicemeeter.getParameter(`${paramElement.type.toLowerCase()}[${paramElement.id}].${func.val}`)
            } catch (error) {
              console.log(error)
            }
          });
        }

        if (paramElement.type.toLowerCase() == 'strip') {
          data.strips.push(out)
        } else if (paramElement.type.toLowerCase() == 'bus') {
          data.buses.push(out)
        }
      });
      resolve(data)
    });
  },
  getVoicemeeterInfo() {
    var index = this._getVoicemeeterType()
    let ver:any = vmChannels[index]
    return { name: ver.name, index: index, version: this.version }
  }
}


//Create setter function
// const parameterStripNames = ['mono', 'solo', 'mute', 'gain', 'gate', 'comp'];
// const parameterBusNames = ['mono', 'mute', 'gain'];

// parameterBusNames.forEach(name => {
//   const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

//   voicemeeter[`setBus${capitalizedName}`] = function (busNumber, value) {
//     if (typeof (value) === 'boolean') {
//       voicemeeter._setParameter(InterfaceType.bus, name, busNumber, value ? '1' : '0')
//     } else {
//       voicemeeter._setParameter(InterfaceType.bus, name, busNumber, value)
//     }
//   }
// });

// parameterStripNames.forEach(name => {
//   const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

//   voicemeeter[`setStrip${capitalizedName}`] = function (stripNumber, value) {
//     if (typeof (value) === 'boolean') {
//       voicemeeter._setParameter(InterfaceType.strip, name, stripNumber, value ? '1' : '0')
//     } else {
//       voicemeeter._setParameter(InterfaceType.strip, name, stripNumber, value)
//     }
//   }

// });

function handle(res:string | number, shouldReturn: boolean = true) {
  if (res < 0 && res > -6) throw new Error(`${res}`); else if (shouldReturn) return Boolean(res);
}

export = voicemeeter;


