import { VoiceMeeterConfig } from './voiceMeeterUtils';
import { VoiceMeeterType } from './index';

const voiceMeeterDefaultConfig: Record<VoiceMeeterType, VoiceMeeterConfig> = {
  0: {
    strips: [],
    buses: [],
  },
  1: {
    strips: [{
      id: 0,
      name: 'Hardware input 1',
    }, {
      id: 1,
      name: 'Hardware input 2',
    }, {
      id: 2,
      name: 'VoiceMeeter VAIO',
      isVirtual: true,
    }],
    buses: [{
      id: 0,
      name: 'Hardware output 1',
    }, {
      id: 1,
      name: 'VoiceMeeter VAIO output',
    }],
  },
  2: {
    strips: [{
      id: 0,
      name: 'Hardware input 1',
    }, {
      id: 1,
      name: 'Hardware input 2',
    }, {
      id: 2,
      name: 'Hardware input 3',
    }, {
      id: 3,
      name: 'VoiceMeeter VAIO',
      isVirtual: true,
    }, {
      id: 4,
      name: 'VoiceMeeter AUX',
      isVirtual: true,
    }],
    buses: [{
      id: 0,
      name: 'Hardware output 1',
    }, {
      id: 1,
      name: 'Hardware output 2',
    }, {
      id: 2,
      name: 'Hardware output 3',
    }, {
      id: 3,
      isVirtual: true,
      name: 'VoiceMeeter VAIO output',
    }, {
      id: 4,
      isVirtual: true,
      name: 'VoiceMeeter VAIO Aux output',
    }],
  },
  3: {
    strips: [{
      id: 0,
      name: 'Hardware input 1',
    }, {
      id: 1,
      name: 'Hardware input 2',
    }, {
      id: 2,
      name: 'Hardware input 3',
    }, {
      id: 3,
      name: 'Hardware input 4',
    }, {
      id: 4,
      name: 'Hardware input 5',
    }, {
      id: 5,
      name: 'VoiceMeeter VAIO',
      isVirtual: true,
    }, {
      id: 6,
      name: 'VoiceMeeter AUX',
      isVirtual: true,
    }, {
      id: 7,
      name: 'VoiceMeeter VAIO 3',
      isVirtual: true,
    }],
    buses: [{
      id: 0,
      name: 'Hardware output 1',
    }, {
      id: 1,
      name: 'Hardware output 2',
    }, {
      id: 2,
      name: 'Hardware output 3',
    }, {
      id: 3,
      name: 'Hardware output 4',
    }, {
      id: 4,
      name: 'Hardware output 5',
    }, {
      id: 5,
      isVirtual: true,
      name: 'VoiceMeeter VAIO output',
    }, {
      id: 6,
      isVirtual: true,
      name: 'VoiceMeeter VAIO Aux output',
    }, {
      id: 7,
      isVirtual: true,
      name: 'VoiceMeeter VAIO3 output',
    }],
  },
};

export = voiceMeeterDefaultConfig
