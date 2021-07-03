export interface voicemeeterGroup {
  id: number,
  name: string,
  isVirtual?: boolean;
}

export interface voicemeeterConfig {
  strips:voicemeeterGroup[],
  buses: voicemeeterGroup[],
}

export enum VoicemeeterType {
  unknown = 0,
  voicemeeter = 1,
  voicemeeterBanana = 2,
  voicemetterPotato = 3
};

export enum InterfaceType {
  strip = 0,
  bus = 1,
};

export interface ioChannels {
    l?: number,
    r?: number,
    fc?: number,
    lfe?: number,
    sl?: number,
    sr?: number,
    bl?: number,
    br?: number
}

export interface voicemeeterIO {
    name: string,
    inputs: ioChannels[],
    outputs: ioChannels[],
}

export type stripParamName = 'mono' | 'mute' | 'solo' | 'mc' | 'gain' | 'pan_x' | 'pan_y' | 'Color_x' | 'Color_y' | 'fx_x' | 'fx_y' | 'Audibility' | 'comp' | 'gate' | 'Karaoke' | 'Limit' | 'EQGain1' | 'EQGain2' | 'EQGain3' | 'Label' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'B1' | 'B2' | 'B3' | 'FadeTo' | 'FadeBy' | 'Reverb' | 'Delay' | 'Fx1' | 'Fx2' | 'PostReverb' | 'PostDelay' | 'PostFx1' | 'PostFx2'

export type busParamName = 'mono' | 'mute' | 'EQ.on' | 'EQ.AB' | 'gain' | 'mode.normal' | 'mode.Amix' | 'mode.Bmix' | 'mode.Repeat' | 'mode.Composite' | 'mode.TVMix' | 'mode.UpMix21' | 'mode.UpMix41' | 'mode.UpMix61' | 'mode.CenterOnly' | 'mode.LFEOnly' | 'mode.RearOnly' | 'Reverb.On' | 'Delay.On'