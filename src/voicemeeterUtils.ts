interface voicemeeterGroup {
  id: number,
  name: string,
  isVirtual?: boolean;
}

interface voicemeeterConfig {
  strips:voicemeeterGroup[],
  buses: voicemeeterGroup[],
}

const voiceMeeterDefaultConfig:Record<VoicemeeterType, voicemeeterConfig> = {
  0: {
    strips: [],
    buses: []
  },
  1: {
    strips: [{
      id: 0,
      name: "Hardware input 1"
    }, {
      id: 1,
      name: "Hardware input 2"
    }, {
      id: 2,
      name: "Voicemeeter VAIO",
      isVirtual: true
    }],
    buses: [{
      id: 0,
      name: "Hardware output 1"
    }, {
      id: 1,
      name: "Voicemeeter VAIO output"
    }]
  },
  2: {
    strips: [{
      id: 0,
      name: "Hardware input 1"
    }, {
      id: 1,
      name: "Hardware input 2"
    }, {
      id: 2,
      name: "Hardware input 3"
    }, {
      id: 3,
      name: "Voicemeeter VAIO",
      isVirtual: true
    }, {
      id: 4,
      name: "Voicemeeter AUX",
      isVirtual: true
    }],
    buses: [{
      id: 0,
      name: "Hardware output 1"
    }, {
      id: 1,
      name: "Hardware output 2"
    }, {
      id: 2,
      name: "Hardware output 3"
    }, {
      id: 3,
      isVirtual: true,
      name: "Voicemeeter VAIO output"
    }, {
      id: 4,
      isVirtual: true,
      name: "Voicemeeter VAIO Aux output"
    }]
  },
  3: {
    strips: [{
      id: 0,
      name: "Hardware input 1"
    }, {
      id: 1,
      name: "Hardware input 2"
    }, {
      id: 2,
      name: "Hardware input 3"
    }, {
      id: 3,
      name: "Hardware input 4"
    }, {
      id: 4,
      name: "Hardware input 5"
    }, {
      id: 5,
      name: "Voicemeeter VAIO",
      isVirtual: true
    }, {
      id: 6,
      name: "Voicemeeter AUX",
      isVirtual: true
    }, {
      id: 7,
      name: "Voicemeeter VAIO 3",
      isVirtual: true
    }],
    buses: [{
      id: 0,
      name: "Hardware output 1"
    }, {
      id: 1,
      name: "Hardware output 2"
    }, {
      id: 2,
      name: "Hardware output 3"
    }, {
      id: 3,
      name: "Hardware output 4"
    }, {
      id: 4,
      name: "Hardware output 5"
    }, {
      id: 5,
      isVirtual: true,
      name: "Voicemeeter VAIO output"
    }, {
      id: 6,
      isVirtual: true,
      name: "Voicemeeter VAIO Aux output"
    }, {
      id: 7,
      isVirtual: true,
      name: "Voicemeeter VAIO3 output"
    }]
  }
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

export const
  VoicemeeterDefaultConfig = voiceMeeterDefaultConfig