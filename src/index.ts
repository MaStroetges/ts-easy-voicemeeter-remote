import ffi from 'ffi-napi';
import Registry from 'winreg';
import ref from 'ref-napi';
import ArrayType from 'ref-array-napi';
import vmChannels from './vmChannels';
import ioFuncs from './ioFuncs';
import voiceMeeterDefaultConfig from './voiceMeeterConfig';
import { IoProperty, IoChannels, VoiceMeeterConfig, StripParamName, BusParamName, DeviceInfo, VoiceMeeterGroupTypes, VoiceMeeterInfo } from './voiceMeeterUtils';
import { VoiceMeeterConnectionError, VoiceMeeterDirtyError, VoiceMeeterError, VoiceMeeterGetParametersError, VoiceMeeterGetVersionError, VoiceMeeterInitializationError, VoiceMeeterLevelError, VoiceMeeterLoginError, VoiceMeeterMacroButtonError, VoiceMeeterMidiError, VoiceMeeterRunError } from './errors';
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
        throw new VoiceMeeterError('Could not find VoiceMeeter installation path');
      }
      const fileNameIndex = uninstallerPath.lastIndexOf('\\');
      resolve(uninstallerPath.slice(0, fileNameIndex));
    });
  });
}

interface VoiceMeeterLibrary {
  VBVMR_Login(): string | number
  VBVMR_Logout(): string | number
  VBVMR_RunVoicemeeter(voiceMeeterType: number): string | number

  VBVMR_GetVoicemeeterType(typePtr: ref.Pointer<string | number>): string | number
  VBVMR_GetVoicemeeterVersion(typePtr: ref.Pointer<string | number>): string | number

  VBVMR_IsParametersDirty(): string | number
  VBVMR_GetParameterFloat(hardwareIdPtr: Buffer, namePtr: ref.Pointer<number>): string | number
  VBVMR_GetParameterStringA(hardwareIdPtr: Buffer, namePtr: Buffer): string | number

  VBVMR_SetParameters(script: Buffer): string | number
  VBVMR_Output_GetDeviceNumber(): string | number
  VBVMR_Output_GetDeviceDescA(deviceId: string | number, typePtr: ref.Pointer<string | number>, namePtr: Buffer, hardwareIdPtr: Buffer): string | number
  VBVMR_Input_GetDeviceNumber(): string | number
  VBVMR_Input_GetDeviceDescA(deviceId: string | number, typePtr: ref.Pointer<string | number>, namePtr: Buffer, hardwareIdPtr: Buffer): string | number

  VBVMR_GetLevel(type: string | number, channel: string | number, value: ref.Pointer<number>): string | number
  VBVMR_GetMidiMessage(buffer: Buffer, size: string | number): string | number

  VBVMR_MacroButton_IsDirty(): string | number
  VBVMR_MacroButton_GetStatus(nuLogicalButton: number, pValue: ref.Pointer<number>, bitmode: number): string | number
  VBVMR_MacroButton_SetStatus(nuLogicalButton: number, fValue: number, bitmode: number): string | number
}

export enum VoiceMeeterType {
  unknown = 0,
  voiceMeeter = 1,
  voiceMeeterBanana = 2,
  voiceMeeterPotato = 3
};

export enum InterfaceType {
  strip = 'strip',
  bus = 'bus',
};

export interface InParam {
  type: InterfaceType,
  id: number,
  getVals: StripParamName[] | BusParamName[]
}

// TODO: is it possible to specify the type of each of these indexes?
// They're MOSTLY numbers, but some have a chance of being a string I guess
export type OutParam = {
  [index in StripParamName | BusParamName]?: any;
} & {
  type: InterfaceType;
  id: number;
};

export interface OutParamData {
  strips: OutParam[],
  buses: OutParam[]
}

export class VoiceMeeter {
  public isConnected: boolean = false;
  public isInitialized: boolean = false;
  public isLoggedIn: boolean = false;
  public outputDevices: DeviceInfo[] = [];
  public inputDevices: DeviceInfo[] = [];
  private channels = vmChannels;
  private type = VoiceMeeterType.unknown;
  private version: string = '';
  private voiceMeeterConfig: VoiceMeeterConfig = voiceMeeterDefaultConfig[VoiceMeeterType.unknown];
  private _libVoiceMeeter: VoiceMeeterLibrary | undefined;

  public get libVoiceMeeter(): VoiceMeeterLibrary {
    if (!this.isInitialized || !this._libVoiceMeeter) {
      throw new VoiceMeeterInitializationError();
    }
    return this._libVoiceMeeter;
  }
  public set libVoiceMeeter(value: VoiceMeeterLibrary) {
    this._libVoiceMeeter = value;
  }

  public async init(): Promise<void> {
    console.debug(await getDLLPath() + '/VoicemeeterRemote64.dll');
    this.libVoiceMeeter = ffi.Library(await getDLLPath() + '/VoicemeeterRemote64.dll', {
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

      'VBVMR_MacroButton_IsDirty': ['long', []],
      'VBVMR_MacroButton_GetStatus': ['long', ['long', 'float *', 'long']],
      'VBVMR_MacroButton_SetStatus': ['long', ['long', 'float', 'long']],
    });
    this.isInitialized = true;
  }

  public runVoiceMeeter(voiceMeeterType: VoiceMeeterType): void {
    let retVal = this.libVoiceMeeter.VBVMR_RunVoicemeeter(voiceMeeterType)
    if (retVal === 0) {
      return;
    }
    throw new VoiceMeeterRunError(retVal);
  }

  // TODO: should only return a number
  public isParametersDirty(): boolean {
    let retVal = this.libVoiceMeeter.VBVMR_IsParametersDirty();
    if (retVal < 0) {
      throw new VoiceMeeterDirtyError(retVal);
    }
    return Boolean(retVal);
  }

  static getStringParameter(voiceMeeter: VoiceMeeter, parameterName: string): string {
    const hardwareIdPtr = Buffer.alloc(parameterName.length + 1);
    hardwareIdPtr.write(parameterName);
    const namePtr = Buffer.alloc(512);
    let retVal = voiceMeeter.libVoiceMeeter.VBVMR_GetParameterStringA(hardwareIdPtr, namePtr);
    if (retVal !== 0) {
      throw new VoiceMeeterGetParametersError(retVal, parameterName);
    }
    return namePtr.toString().replace(/\x00+$/g, '');
  }

  static getParameter(voiceMeeter: VoiceMeeter, parameterName: string): number {
    const hardwareIdPtr = Buffer.alloc(parameterName.length + 1);
    hardwareIdPtr.write(parameterName);
    const namePtr = ref.alloc(ref.types.float).ref();
    let retVal = voiceMeeter.libVoiceMeeter.VBVMR_GetParameterFloat(hardwareIdPtr, namePtr);
    if (retVal !== 0) {
      throw new VoiceMeeterGetParametersError(retVal, parameterName);
    }
    // TODO: Find out, must we use readFloatLE?
    // return namePtr[0];
    return namePtr.readFloatLE();
  }

  private _getVoiceMeeterType(): VoiceMeeterType {
    const typePtr: ref.Pointer<string | number> = ref.alloc(ref.types.long).ref();

    let retVal = this.libVoiceMeeter.VBVMR_GetVoicemeeterType(typePtr);

    if (retVal !== 0) {
      throw new VoiceMeeterGetVersionError(retVal);
    }

    switch (typePtr.readInt32LE()) {
      case 1: // VoiceMeeter software
        return VoiceMeeterType.voiceMeeter;
      case 2: // VoiceMeeter Banana software
        return VoiceMeeterType.voiceMeeterBanana;
      case 3: // VoiceMeeter Potato software
        return VoiceMeeterType.voiceMeeterPotato;
      default: // unknown software
        return VoiceMeeterType.unknown;
    }
  }

  private _getVoiceMeeterVersion(): string {
    // Pointer on 32bit integer receiving the version (v1.v2.v3.v4)
    // 				v1 = (version & 0xFF000000)>>24;
    // 				v2 = (version & 0x00FF0000)>>16;
    // 				v3 = (version & 0x0000FF00)>>8;
    // 				v4 = version & 0x000000FF;
    const versionPtr = ref.alloc(ref.types.long).ref();
    let retVal = this.libVoiceMeeter.VBVMR_GetVoicemeeterVersion(versionPtr)
    if (retVal !== 0) {
      throw new VoiceMeeterGetVersionError(retVal);
    }

    const fullVer = versionPtr.readInt32LE();
    const v4 = fullVer % Math.pow(2, 8);
    const v3 = (fullVer - v4) % Math.pow(2, 16) / Math.pow(2, 8);
    const v2 = ((fullVer - v3 * 256 - v4) % Math.pow(2, 24)) / Math.pow(2, 16);
    const v1 = (fullVer - v2 * 512 - v3 * 256 - v4) / Math.pow(2, 24);

    return `${v1}.${v2}.${v3}.${v4}`;
  }

  public login(): void {
    if (!this.isInitialized) {
      throw new VoiceMeeterInitializationError();
    }
    if (this.isConnected || this.isLoggedIn) {
      return;
    }
    let retVal = this.libVoiceMeeter.VBVMR_Login();
    // 0 = no error
    // 1 = connected but no application;
    if (retVal == 0) {
      this.isConnected = true;
      this.isLoggedIn = true;
      this.type = this._getVoiceMeeterType();
      this.version = this._getVoiceMeeterVersion();
      this.voiceMeeterConfig = voiceMeeterDefaultConfig[this.type];
      return;
    }
    if (retVal == 1) {
      this.isLoggedIn = true;
    }

    this.isConnected = false;
    throw new VoiceMeeterLoginError(retVal);
  }

  // TODO: review this function and what it should do
  /** Test if we have an active connection to a running instance of VoiceMeeter */
  public testConnection(): boolean {
    let comError = this.libVoiceMeeter.VBVMR_IsParametersDirty();

    if (comError >= 0) {
      this.isConnected = true;
      this.type = this._getVoiceMeeterType();
      this.version = this._getVoiceMeeterVersion();
      this.voiceMeeterConfig = voiceMeeterDefaultConfig[this.type];
    }

    return comError >= 0;
  }

  public logout() {
    if (!this.isLoggedIn) {
      throw new VoiceMeeterError('Not logged in');
    }
    if (!this.isConnected) {
      throw new VoiceMeeterConnectionError();
    }
    if (this.libVoiceMeeter.VBVMR_Logout() === 0) {
      this.isConnected = false;
      this.isLoggedIn = false;
      return;
    }
    throw new VoiceMeeterError('Logout failed unexpectedly');
  }

  public updateDeviceList() {
    if (!this.isConnected) {
      throw new VoiceMeeterConnectionError();
    }

    this.outputDevices = [];
    this.inputDevices = [];
    const outputDeviceNumber = this.libVoiceMeeter.VBVMR_Output_GetDeviceNumber();
    for (let i = 0; i < outputDeviceNumber; i++) {
      const typePtr: ref.Pointer<string | number> = ref.alloc(ref.types.long).ref();
      const namePtr = Buffer.alloc(256);
      const hardwareIdPtr = Buffer.alloc(256);

      if (this.libVoiceMeeter.VBVMR_Output_GetDeviceDescA(i, typePtr, namePtr, hardwareIdPtr) !== 0) {
        throw new VoiceMeeterError('Error getting output device');
      }

      this.outputDevices.push({
        name: namePtr.toString().replace(/\x00+$/g, ''),
        hardwareId: hardwareIdPtr.toString().replace(/\x00+$/g, ''),
        type: typePtr.readInt32LE(),
      });
    }

    const inputDeviceNumber = this.libVoiceMeeter.VBVMR_Input_GetDeviceNumber();
    for (let i = 0; i < inputDeviceNumber; i++) {
      const typePtr: ref.Pointer<string | number> = ref.alloc(ref.types.long).ref();
      const namePtr = Buffer.alloc(256);
      const hardwareIdPtr = Buffer.alloc(256);

      if (this.libVoiceMeeter.VBVMR_Input_GetDeviceDescA(i, typePtr, namePtr, hardwareIdPtr) !== 0) {
        throw new VoiceMeeterError('Error getting output device');
      }

      this.inputDevices.push({
        name: namePtr.toString().replace(/\x00+$/g, ''),
        hardwareId: hardwareIdPtr.toString().replace(/\x00+$/g, ''),
        type: typePtr.readInt32LE(),
      });
    }
  }

  public sendRawParameterScript(scriptString: string) {
    const script = Buffer.alloc(scriptString.length + 1);
    script.fill(0);
    script.write(scriptString);

    let retVal = this.libVoiceMeeter.VBVMR_SetParameters(script);

    if (retVal !== 0) {
      // 
    }
    return retVal;
  }

  private _setParameter(type: InterfaceType, name: string, id: number, value: boolean | number | string) {
    if (typeof (value) === 'boolean') {
      value = value ? 1 : 0;
    }

    return this.sendRawParameterScript(`${type}[${id}].${name}=${value};`);
  }

  public setStripParameter(name: StripParamName, id: number, value: boolean | number | string) {
    if (this.voiceMeeterConfig.strips.findIndex((strip) => strip.id === id) === -1) {
      // TODO: replace with a better error
      throw new VoiceMeeterError(`${InterfaceType[InterfaceType.strip]} ${id} not found`);
    }

    return this._setParameter(InterfaceType.strip, name, id, value);
  }

  public setBusParameter(name: BusParamName, id: number, value: boolean | number | string) {
    if (this.voiceMeeterConfig.buses.findIndex((bus) => bus.id === id) === -1) {
      // TODO: replace with a better error
      throw new VoiceMeeterError(`${InterfaceType[InterfaceType.bus]} ${id} not found`);
    }

    return this._setParameter(InterfaceType.bus, name, id, value);
  }

  public getLevel(type: number, channel: number | undefined): number {
    if (!channel) {
      return 0;
    }
    const value = ref.alloc(ref.types.float).ref();
    let retVal = this.libVoiceMeeter.VBVMR_GetLevel(type, channel, value);

    if (retVal !== 0) {
      throw new VoiceMeeterLevelError(retVal);
    }

    return 20 * Math.log10(value.readFloatLE()) + 60;
  }

  public getMidi() {
    const buffer = Buffer.alloc(1024);
    let retVal = this.libVoiceMeeter.VBVMR_GetMidiMessage(buffer, 1024);
    if (retVal < 0) {
      throw new VoiceMeeterMidiError(retVal);
    }

    const unorg = Uint8Array.from(buffer);
    const org = [];
    for (let i = 0; i < unorg.length; i += 3) if (unorg[i]) org.push([unorg[i], unorg[i + 1], unorg[i + 2]]);
    return org;
  }

  public getLevelByID(m: number, index: number) {
    const mode = m || 0;
    index = index || 0;
    const out: IoChannels = {};
    const vmType = this._getVoiceMeeterType();
    const vmChannelsByType = this.channels[vmType];
    if (!vmChannelsByType) {
      // TODO: replace with a better error
      throw new VoiceMeeterError('Invalid VoiceMeeter type');
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
      const inputs = this.voiceMeeterConfig.strips;
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

  private _getGetParamType(prop: IoProperty) {
    const func = prop.type == 'float' ? VoiceMeeter.getParameter : VoiceMeeter.getStringParameter;
    return func;
  }

  public async getAllParameters(): Promise<OutParamData> {
    return new Promise((resolve, rejects) => {
      const data: OutParamData = {
        strips: <OutParam[]>[],
        buses: <OutParam[]>[],
      };

      this.voiceMeeterConfig.strips.forEach((element) => {
        const inP: InParam = {
          type: InterfaceType[InterfaceType.strip],
          id: element.id,
          getVals: [],
        };
        const out: OutParam = {
          type: inP.type,
          id: element.id,
          name: element.name,
        };
        for (const funcName in ioFuncs.strip) {
          const func = ioFuncs.strip[funcName];
          let val = this._getGetParamType(func)(this, `Strip[${element.id}].${func.val}`);
          if (typeof (val) != "string" || val) {
            out[func.out as StripParamName] = val
          }
        }
        data.strips.push(out);
      });

      this.voiceMeeterConfig.buses.forEach((element) => {
        const inP: InParam = {
          type: InterfaceType.bus,
          id: element.id,
          getVals: [],
        };
        const out: OutParam = {
          type: inP.type,
          id: element.id,
          name: element.name,
        };
        for (const funcName in ioFuncs.bus) {
          const func = ioFuncs.bus[funcName];
          let val = this._getGetParamType(func)(this, `Bus[${element.id}].${func.val}`);
          if (typeof (val) != "string" || val) {
            out[func.out as BusParamName] = val
          }
        }
        data.buses.push(out);
      });
      resolve(data);
    });
  }
  public async getMultiParameter(param: InParam[]): Promise<OutParamData> {
    return new Promise((resolve, rejects) => {
      const data: OutParamData = {
        strips: <OutParam[]>[],
        buses: <OutParam[]>[],
      };

      param.forEach((paramElement) => {
        const t = paramElement.type == InterfaceType.strip ? VoiceMeeterGroupTypes.strips : VoiceMeeterGroupTypes.buses;
        const out: OutParam = {
          type: paramElement.type,
          id: paramElement.id,
          name: this.voiceMeeterConfig[t][paramElement.id].name,
        };
        // always include getting name val
        paramElement.getVals.push('name');
        paramElement.getVals.forEach((element) => {
          try {
            const func = ioFuncs[paramElement.type][element];
            const val = this._getGetParamType(func)(this, `${paramElement.type}[${paramElement.id}].${func.val}`);
            if (typeof (val) != "string" || val) {
              out[func.out as (BusParamName | StripParamName)] = val;
            }
          } catch (error) {
            console.log(error);
          }
        });

        if (paramElement.type == InterfaceType.strip) {
          data.strips.push(out);
        } else if (paramElement.type == InterfaceType.bus) {
          data.buses.push(out);
        }
      });
      resolve(data);
    });
  }

  public getVoiceMeeterInfo(): VoiceMeeterInfo {
    return { name: this.channels[this.type].name, type: this.type, version: this.version };
  }

  public isMacroButtonDirty() {
   let retVal = this.libVoiceMeeter.VBVMR_MacroButton_IsDirty();
   if (retVal < 0) {
     throw new VoiceMeeterDirtyError(retVal);
   }
    return retVal
  }

  public getMacroButtonStatus(index: number): number {
    const pValue = ref.alloc(ref.types.float).ref();
    // bitmode
    // 0 = push or release
    // 2 = change displayed state only
    // 3 = change Trigger state
    let retVal = this.libVoiceMeeter.VBVMR_MacroButton_GetStatus(index, pValue, 0);
    if (retVal < 0) {
      throw new VoiceMeeterMacroButtonError(retVal);
    }
    return pValue.readFloatLE();
  }

  /**
   *
   * @param index The logical ID of the macro button
   * @param value Button state 0 or 1
   * @returns 0 = success
   */
  public setMacroButtonStatus(index: number, value: number) {
   let retVal = this.libVoiceMeeter.VBVMR_MacroButton_SetStatus(index, value, 0);
   if (retVal !== 0) {
      throw new VoiceMeeterMacroButtonError(retVal);
   }
    return retVal;
  }

  public toggleMacroButtonStatus(index: number) {
    if (this.getMacroButtonStatus(index) == 1) {
      return this.setMacroButtonStatus(index, 0);
    }
    else {
      return this.setMacroButtonStatus(index, 1);
    }
  }
}

export { VoiceMeeterConnectionError, VoiceMeeterDirtyError, VoiceMeeterError, VoiceMeeterGetParametersError, VoiceMeeterGetVersionError, VoiceMeeterInitializationError, VoiceMeeterLevelError, VoiceMeeterLoginError, VoiceMeeterMacroButtonError, VoiceMeeterMidiError, VoiceMeeterRunError } from './errors';
export { VoiceMeeterInfo, StripParamName, BusParamName, VoiceMeeterGroup, IoChannels, VoiceMeeterIO, VoiceMeeterGroupTypes } from './voiceMeeterUtils';