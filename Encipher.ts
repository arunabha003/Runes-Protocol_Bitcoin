import { Runestone, RuneId, none, some } from 'runelib';

const block = 2586233;
const txIndex = 1009;
const mintstone = new Runestone([], none(), some(new RuneId(block, txIndex)), some(1));

const buffer = mintstone.encipher();
console.log(buffer);
