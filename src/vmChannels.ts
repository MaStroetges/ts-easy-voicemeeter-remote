import {VoicemeeterIO} from './voicemeeterUtils';
import {VoicemeeterType} from './index';

const vmChannels:Record<VoicemeeterType, VoicemeeterIO> = {
  0: {
    name: 'unknown',
    inputs: [],
    outputs: [],
  },
  1: {
    name: 'Voicemeeter',
    inputs: [
      {l: 0, r: 1},
      {l: 2, r: 3},
      {l: 4, r: 5, fc: 6, lfe: 7, sl: 8, sr: 9, bl: 10, br: 11},
    ],
    outputs: [
      {l: 0, r: 1, fc: 2, lfe: 3, sl: 4, sr: 5, bl: 6, br: 6},
      {l: 0, r: 1, fc: 2, lfe: 3, sl: 4, sr: 5, bl: 6, br: 6},
      {l: 8, r: 9, fc: 10, lfe: 11, sl: 12, sr: 13, bl: 14, br: 15},
    ],
  },
  2: {
    name: 'Voicemeeter Banana',
    inputs: [
      {l: 0, r: 1},
      {l: 2, r: 3},
      {l: 4, r: 5},
      {l: 6, r: 7, fc: 8, lfe: 9, sl: 10, sr: 11, bl: 12, br: 13},
      {l: 14, r: 15, fc: 16, lfe: 17, sl: 18, sr: 19, bl: 20, br: 21},
    ],
    outputs: [
      {l: 0, r: 1, fc: 2, lfe: 3, sl: 4, sr: 5, bl: 6, br: 6},
      {l: 8, r: 9, fc: 10, lfe: 11, sl: 12, sr: 13, bl: 14, br: 15},
      {l: 16, r: 17, fc: 18, lfe: 19, sl: 20, sr: 21, bl: 22, br: 23},
      {l: 24, r: 25, fc: 26, lfe: 27, sl: 28, sr: 29, bl: 30, br: 31},
      {l: 32, r: 33, fc: 34, lfe: 35, sl: 36, sr: 37, bl: 38, br: 39},
    ],
  },
  3: {
    name: 'Voicemeeter Potato',
    inputs: [
      {l: 0, r: 1},
      {l: 2, r: 3},
      {l: 4, r: 5},
      {l: 6, r: 7},
      {l: 8, r: 9},
      {l: 10, r: 11, fc: 12, lfe: 13, sl: 14, sr: 15, bl: 16, br: 17},
      {l: 18, r: 19, fc: 20, lfe: 21, sl: 22, sr: 23, bl: 24, br: 25},
      {l: 26, r: 27, fc: 28, lfe: 29, sl: 30, sr: 31, bl: 32, br: 33},
    ],
    outputs: [
      {l: 0, r: 1, fc: 2, lfe: 3, sl: 4, sr: 5, bl: 6, br: 6},
      {l: 8, r: 9, fc: 10, lfe: 11, sl: 12, sr: 13, bl: 14, br: 15},
      {l: 16, r: 17, fc: 18, lfe: 19, sl: 20, sr: 21, bl: 22, br: 23},
      {l: 24, r: 25, fc: 26, lfe: 27, sl: 28, sr: 29, bl: 30, br: 31},
      {l: 32, r: 33, fc: 34, lfe: 35, sl: 36, sr: 37, bl: 38, br: 39},
      {l: 40, r: 41, fc: 42, lfe: 43, sl: 44, sr: 45, bl: 46, br: 47},
      {l: 48, r: 49, fc: 50, lfe: 51, sl: 52, sr: 53, bl: 54, br: 55},
      {l: 56, r: 57, fc: 58, lfe: 59, sl: 60, sr: 61, bl: 62, br: 63},
    ],
  },
};

export = vmChannels;
