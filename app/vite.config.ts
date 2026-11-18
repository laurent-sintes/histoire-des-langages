import { buildKnowledge } from '../packages/compiler/build.ts';

export default {
  base: './',
  plugins: [{
    name: 'histoire-modele-connaissance',
    async config() {
      await buildKnowledge();
    },
  }],
};
