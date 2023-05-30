import { VoiceMeeterType } from "."

export enum VoiceMeeterGroupTypes {
  strips = 'strips',
  buses = 'buses'
}

export interface VoiceMeeterGroup {
  id: number,
  name: string,
  isVirtual?: boolean;
}

export interface VoiceMeeterConfig {
  strips: VoiceMeeterGroup[],
  buses: VoiceMeeterGroup[],
}

export interface IoChannels {
    l?: number,
    r?: number,
    fc?: number,
    lfe?: number,
    sl?: number,
    sr?: number,
    bl?: number,
    br?: number
}

export interface VoiceMeeterIO {
    name: string,
    inputs: IoChannels[],
    outputs: IoChannels[],
};

export interface DeviceInfo {
  name: string,
  hardwareId: string,
  type: number | string
}

export interface IoProperty {
  out: string,
  val: string,
  type: 'float' | 'string'
}

export type StripParamName = 'name' | 'mono' | 'mute' | 'solo' | 'mc' | 'gain' | 'pan_x' | 'pan_y' | 'Color_x' | 'Color_y' | 'fx_x' | 'fx_y' | 'Audibility' | 'comp' | 'gate' | 'Karaoke' | 'Limit' | 'EQGain1' | 'EQGain2' | 'EQGain3' | 'Label' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'B1' | 'B2' | 'B3' | 'FadeTo' | 'FadeBy' | 'Reverb' | 'Delay' | 'Fx1' | 'Fx2' | 'PostReverb' | 'PostDelay' | 'PostFx1' | 'PostFx2' | 'Device' | 'GainLayer[0]' | 'GainLayer[1]' | 'GainLayer[2]' | 'GainLayer[3]' | 'GainLayer[4]' | 'GainLayer[5]' | 'GainLayer[6]' | 'GainLayer[7]'

export type BusParamName = 'name' | 'mono' | 'mute' | 'EQ.on' | 'EQ.AB' | 'EQ.channel[0].cell[0].gain' | 'EQ.channel[0].cell[1].gain' | 'EQ.channel[0].cell[2].gain' | 'EQ.channel[0].cell[3].gain' | 'EQ.channel[0].cell[4].gain' | 'EQ.channel[0].cell[5].gain' | 'EQ.channel[1].cell[0].gain' | 'EQ.channel[1].cell[1].gain' | 'EQ.channel[1].cell[2].gain' | 'EQ.channel[1].cell[3].gain' | 'EQ.channel[1].cell[4].gain' | 'EQ.channel[1].cell[5].gain' | 'gain' | 'mode.normal' | 'mode.Amix' | 'mode.Bmix' | 'mode.Repeat' | 'mode.Composite' | 'mode.TVMix' | 'mode.UpMix21' | 'mode.UpMix41' | 'mode.UpMix61' | 'mode.CenterOnly' | 'mode.LFEOnly' | 'mode.RearOnly' | 'Reverb.On' | 'Delay.On' | 'Sel'

export interface VoiceMeeterInfo {
  name: string,
  type: VoiceMeeterType,
  version: string,
}
