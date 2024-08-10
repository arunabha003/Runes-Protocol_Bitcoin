import { Runestone } from 'runelib';

const mintRawTx = '02000000000101dc58870c48618a937cda4ea238587e17413dde50f8fb8de0e87144acea817bbb0100000000fdffffff030000000000000000086a5d0514d301140110270000000000002251207817a206d8fc43fe54a61a94dd4ff01ec7286826cf44526a59265bf9d3909c66f39b052a01000000225120675fad4019ca08cdc3cf8678af6faa6686b719389a930b0fa13c4ecf9ea7d08b0140f775e5e75ac8ed4d1556779525da619851a95d8328a78382c1c719cf28c76eaf550551643b9e92feba132f75595992d34babe1193ecfad03eb5d830b42da10c100000000';

const stone = Runestone.decipher(mintRawTx);
console.log(stone);
