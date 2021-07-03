import ffi from 'ffi-napi';
import Registry from 'winreg';
import ref from 'ref-napi';
import ArrayType from 'ref-array-napi';
import vmChannels from './vmChannels';
import ioFuncs from './ioFuncs';
import voicemeeterDefaultConfig from './voicemeeterConfig';
import {VoicemeeterType, InterfaceType, voicemeeterIO, ioChannels, voicemeeterConfig, stripParamName, busParamName} from './voicemeeterUtils';
// TODO: Can this be replaced?
const CharArray = ArrayType<number>(ref.types.char);

async function getDLLPath() {
  const regKey = new Registry({
    hive: Registry.HKLM,
    key: '\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\VB:Voicemeeter {17359A74-1236-5467}',
  });
  return new Promise((resolve) => {
    regKey.values((err, items) => {
      const uninstallerPath = items.find((i) => i.name === 'UninstallString')?.value;
      if (!uninstallerPath) {
        throw new Error('Could not find Voicemeeter installation path');
      }
      const fileNameIndex = uninstallerPath.lastIndexOf('\\');
      resolve(uninstallerPath.slice(0, fileNameIndex));
    });
  });
}

interface VoicemeeterLibrary {
  VBVMR_Login(): string | number
  VBVMR_Logout(): string | number
  VBVMR_RunVoicemeeter(voicemeeterType: number): string | number

  VBVMR_GetVoicemeeterType(typePtr: ref.Pointer<string | number>): string | number
  VBVMR_GetVoicemeeterVersion(typePtr: ref.Pointer<string | number>): string | number

  VBVMR_IsParametersDirty(): string | number
  VBVMR_GetParameterFloat(hardwareIdPtr: Buffer, namePtr: ref.Pointer<number>): string | number

  VBVMR_SetParameters(script: Buffer): string | number
  VBVMR_Output_GetDeviceNumber(): string | number
  VBVMR_Output_GetDeviceDescA(deviceId: string | number, typePtr: ref.Pointer<string | number>, namePtr: Buffer, hardwareIdPtr: Buffer): string | number
  VBVMR_Input_GetDeviceNumber(): string | number
  VBVMR_Input_GetDeviceDescA(deviceId: string | number, typePtr: ref.Pointer<string | number>, namePtr: Buffer, hardwareIdPtr: Buffer): string | number

  VBVMR_GetLevel(type: string | number, channel: string | number, value: ref.Pointer<number>): string | number
  VBVMR_GetMidiMessage(buffer: Buffer, size: string | number): string | number
}

interface deviceInfo {
  name: string,
  hardwareId: string,
  type: number | string
}

interface inParam {
  type: InterfaceType,
  id: number,
  getVals: stripParamName[] | busParamName[]
}

interface outParam {
  // TODO: Can I replace this index
  [index: string]:any,
  type: InterfaceType,
  id: number,
}

interface outParamData {
  strips: outParam[],
  buses: outParam[]
}

// TODO: Can this be in the voicemeeter class?
let libvoicemeeter: VoicemeeterLibrary;

export class voicemeeter {
  public isConnected: boolean = false;
  public isInitialised: boolean = false;
  public outputDevices: deviceInfo[] = [];
  public inputDevices: deviceInfo[] = [];
  private channels = vmChannels;
  private type = VoicemeeterType.unknown;
  private version: string = '';
  private voicemeeterConfig: voicemeeterConfig = voicemeeterDefaultConfig[VoicemeeterType.unknown];

  public async init(): Promise<void> {
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
  }

  public runvoicemeeter(voicemeeterType: number) {
    if (libvoicemeeter.VBVMR_RunVoicemeeter(voicemeeterType) === 0) {
      return;
    }
    throw 'running failed';
  }

  public isParametersDirty() {
    return libvoicemeeter.VBVMR_IsParametersDirty();
  }

  public getParameter(parameterName: string) {
    if (!this.isConnected) {
      throw 'Not connected ';
    }
    const hardwareIdPtr = Buffer.alloc(parameterName.length + 1);
    hardwareIdPtr.write(parameterName);
    const namePtr = ref.alloc(ref.types.float).ref();
    libvoicemeeter.VBVMR_GetParameterFloat(hardwareIdPtr, namePtr);
    // TODO: Find out, must we use readFloatLE?
    // return namePtr[0];
    return namePtr.readFloatLE();
  }

  private _getVoicemeeterType() {
    const typePtr: ref.Pointer<string | number> = ref.alloc(ref.types.long).ref();

    if (libvoicemeeter.VBVMR_GetVoicemeeterType(typePtr) !== 0) {
      throw 'running failed';
    }

    switch (typePtr[0]) {
      case 1: // Voicemeeter software
        return VoicemeeterType.voicemeeter;
      case 2: // Voicemeeter Banana software
        return VoicemeeterType.voicemeeterBanana;
      case 3:
        return VoicemeeterType.voicemetterPotato;
      default: // unknown software
        return VoicemeeterType.unknown;
    }
  }

  private _getVoicemeeterVersion() {
    // Pointer on 32bit integer receiving the version (v1.v2.v3.v4)
    // 				v1 = (version & 0xFF000000)>>24;
    // 				v2 = (version & 0x00FF0000)>>16;
    // 				v3 = (version & 0x0000FF00)>>8;
    // 				v4 = version & 0x000000FF;
    const versionPtr = ref.alloc(ref.types.long).ref();
    if (libvoicemeeter.VBVMR_GetVoicemeeterVersion(versionPtr) !== 0) {
      throw 'running failed';
    }

    let fullVer = versionPtr.readInt32LE();
    const v4 = fullVer % Math.pow(2, 8);
    const v3 = (fullVer - v4) % Math.pow(2, 16) / Math.pow(2, 8);
    const v2 = ((fullVer - v3 * 256 - v4) % Math.pow(2, 24)) / Math.pow(2, 16);
    const v1 = (fullVer - v2 * 512 - v3 * 256 - v4) / Math.pow(2, 24);

    return `${v1}.${v2}.${v3}.${v4}`;
  }

  public login() {
    if (!this.isInitialised) {
      throw 'await the initialisation before login';
    }
    if (this.isConnected) {
      return;
    }
    if (libvoicemeeter.VBVMR_Login() === 0) {
      this.isConnected = true;
      this.type = this._getVoicemeeterType();
      this.version = this._getVoicemeeterVersion();
      this.voicemeeterConfig = voicemeeterDefaultConfig[this.type];
      return;
    }
    this.isConnected = false;
    throw 'Connection failed';
  }

  public logout() {
    if (!this.isConnected) {
      throw 'Not connected';
    }
    if (libvoicemeeter.VBVMR_Logout() === 0) {
      this.isConnected = false;
      return;
    }
    throw 'Logout failed';
  }

  public updateDeviceList() {
    if (!this.isConnected) {
      throw 'Not connected ';
    }

    this.outputDevices = [];
    this.inputDevices = [];
    const outputDeviceNumber = libvoicemeeter.VBVMR_Output_GetDeviceNumber();
    for (let i = 0; i < outputDeviceNumber; i++) {
      const typePtr: ref.Pointer<string | number> = ref.alloc(ref.types.long).ref();
      const namePtr = Buffer.alloc(256);
      const hardwareIdPtr = Buffer.alloc(256);

      if (libvoicemeeter.VBVMR_Output_GetDeviceDescA(i, typePtr, namePtr, hardwareIdPtr) !== 0) {
        throw new Error('Error getting output device');
      }

      this.outputDevices.push({
        name: namePtr.toString().replace(/\x00+$/g, ''),
        hardwareId: hardwareIdPtr.toString().replace(/\x00+$/g, ''),
        type: typePtr[0],
      });
    }

    const inputDeviceNumber = libvoicemeeter.VBVMR_Input_GetDeviceNumber();
    for (let i = 0; i < inputDeviceNumber; i++) {
      const typePtr: ref.Pointer<string | number> = ref.alloc(ref.types.long).ref();
      const namePtr = Buffer.alloc(256);
      const hardwareIdPtr = Buffer.alloc(256);

      if (libvoicemeeter.VBVMR_Input_GetDeviceDescA(i, typePtr, namePtr, hardwareIdPtr) !== 0) {
        throw new Error('Error getting output device');
      }

      this.inputDevices.push({
        name: namePtr.toString().replace(/\x00+$/g, ''),
        hardwareId: hardwareIdPtr.toString().replace(/\x00+$/g, ''),
        type: typePtr[0],
      });
    }
  }

  public sendRawParameterScript(scriptString:string) {
    const script = Buffer.alloc(scriptString.length + 1);
    script.fill(0);
    script.write(scriptString);
    return libvoicemeeter.VBVMR_SetParameters(script);
  }

  private _setParameter(type: InterfaceType, name:string, id: number, value:boolean | number | string) {
    if (typeof(value) === 'boolean') {
      value = value ? 1 : 0;
    }

    return this.sendRawParameterScript(`${type}[${id}].${name}=${value};`);
  }

  public setStripParameter(name:stripParamName, id: number, value:boolean | number | string) {
    if (this.voicemeeterConfig.strips.findIndex((strip) => strip.id === id) === -1) {
      throw `${InterfaceType[InterfaceType.strip]} ${id} not found`;
    }

    return this._setParameter(InterfaceType.strip, name, id, value);
  }

  public setBusParameter(name:busParamName, id: number, value:boolean | number | string) {
    if (this.voicemeeterConfig.buses.findIndex((bus) => bus.id === id) === -1) {
      throw `${InterfaceType[InterfaceType.bus]} ${id} not found`;
    }

    return this._setParameter(InterfaceType.bus, name, id, value);
  }

  public getLevel(type: number, channel: number | undefined) {
    // TODO: rethink this
    if (!channel) {
      return;
    }
    const value = ref.alloc(ref.types.float).ref();
    handle(libvoicemeeter.VBVMR_GetLevel(type, channel, value));
    return 20 * Math.log10(value.readFloatLE()) + 60;
  }

  public getMidi() {
    const buffer = Buffer.alloc(1024);
    handle(libvoicemeeter.VBVMR_GetMidiMessage(buffer, 1024));
    const unorg = Uint8Array.from(buffer); ;
    const org = [];
    for (let i = 0; i < unorg.length; i += 3) if (unorg[i]) org.push([unorg[i], unorg[i + 1], unorg[i + 2]]);
    return org;
  }

  public getLevelByID(m:number, index:number) {
    const mode = m || 0;
    index = index || 0;
    const out: ioChannels = {};
    const vmType = this._getVoicemeeterType();
    const vmChannelsByType = this.channels[vmType];
    if (!vmChannelsByType) {
      throw new Error('Invalid voicemeeter type');
    }
    if (mode == 3) {
      const outChannels = vmChannelsByType.outputs[index];
      out.l = this.getLevel(mode, outChannels.l);
      out.r = this.getLevel(mode, outChannels.r);
      out.fc = this.getLevel(mode, outChannels.fc);
      out.lfe = this.getLevel(mode, outChannels.lfe);
      out.sl = this.getLevel(mode, outChannels.sl);
      out.sr = this.getLevel(mode, outChannels.sr);
      out.bl = this.getLevel(mode, outChannels.bl);
      out.br = this.getLevel(mode, outChannels.br);
      return out;
    } else if (mode == 0 || 1 || 2) {
      const inChannels = vmChannelsByType.inputs[index];
      const inputs = this.voicemeeterConfig.strips;
      if (inputs[index].isVirtual) {
        out.l = this.getLevel(mode, inChannels.l);
        out.r = this.getLevel(mode, inChannels.r);
        out.fc = this.getLevel(mode, inChannels.fc);
        out.lfe = this.getLevel(mode, inChannels.lfe);
        out.sl = this.getLevel(mode, inChannels.sl);
        out.sr = this.getLevel(mode, inChannels.sr);
        out.bl = this.getLevel(mode, inChannels.bl);
        out.br = this.getLevel(mode, inChannels.br);
      } else {
        out.l = this.getLevel(mode, inChannels.l);
        out.r = this.getLevel(mode, inChannels.r);
      }
      return out;
    }
  }
  public async getAllParameter(): Promise<outParamData> {
    return new Promise((resolve, rejects) => {
      const data: outParamData = {
        strips: <outParam[]>[],
        buses: <outParam[]>[],
      };

      this.voicemeeterConfig.strips.forEach((element) => {
        const inP: inParam = {
          type: InterfaceType[InterfaceType.strip],
          id: element.id,
          getVals: [],
        };
        const out:outParam = {
          type: inP.type,
          id: element.id,
        };
        for (const funcName in ioFuncs.strip) {
          const func = ioFuncs.strip[funcName];
          out[func.out] = this.getParameter(`Strip[${element.id}].${func.val}`);
        }
        data.strips.push(out);
      });

      this.voicemeeterConfig.buses.forEach((element) => {
        const inP: inParam = {
          type: InterfaceType.bus,
          id: element.id,
          getVals: [],
        };
        const out:outParam = {
          type: inP.type,
          id: element.id,
        };
        for (const funcName in ioFuncs.bus) {
          const func = ioFuncs.bus[funcName];
          out[func.out] = this.getParameter(`Bus[${element.id}].${func.val}`);
        }
        data.buses.push(out);
      });
      resolve(data);
    });
  }

  public async getMultiParameter(param: inParam[]) {
    return new Promise((resolve, rejects) => {
      const data = {
        strips: <outParam[]>[],
        buses: <outParam[]>[],
      };

      param.forEach((paramElement) => {
        const out:outParam = {
          type: paramElement.type,
          id: paramElement.id,
        };
        if (paramElement.type.toLowerCase() == 'strip' || 'bus') {
          paramElement.getVals.forEach((element) => {
            try {
              const func = ioFuncs[paramElement.type.toLowerCase()][element.toLowerCase()];
              out[func.out] = this.getParameter(`${paramElement.type.toLowerCase()}[${paramElement.id}].${func.val}`);
            } catch (error) {
              console.log(error);
            }
          });
        }

        if (paramElement.type.toLowerCase() == 'strip') {
          data.strips.push(out);
        } else if (paramElement.type.toLowerCase() == 'bus') {
          data.buses.push(out);
        }
      });
      resolve(data);
    });
  }

  public getVoicemeeterInfo() {
    const index = this._getVoicemeeterType();
    const ver:any = this.channels[index];
    return {name: ver.name, index: index, version: this.version};
  }
}

function handle(res:string | number, shouldReturn: boolean = true) {
  if (res < 0 && res > -6) throw new Error(`${res}`); else if (shouldReturn) return Boolean(res);
}

