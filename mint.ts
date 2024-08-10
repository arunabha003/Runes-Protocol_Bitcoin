import { Runestone, RuneId, none, some } from 'runelib';
import { ECPairFactory, ECPairAPI, TinySecp256k1Interface } from 'ecpair';
import { payments, Psbt, Address } from 'bitcoinjs-lib';
import { waitUntilUTXO, signAndSend } from './utils/funs'; // Assuming these utilities are implemented

const tinysecp: TinySecp256k1Interface = require('tiny-secp256k1');
const ECPair: ECPairAPI = ECPairFactory(tinysecp);

async function mint(yourKey: string, network: any, ord_address: string, change_address: string) {
    const mintstone = new Runestone([], none(), some(new RuneId(1, 0)), some(1));

    const keyPair = ECPair.fromWIF(yourKey, network);

    const { address } = payments.p2wpkh({ pubkey: keyPair.publicKey, network });

    console.log('address:', address);

    const utxos = await waitUntilUTXO(address as string);
    console.log(`Using UTXO ${utxos[0].txid}:${utxos[0].vout}`);

    const psbt = new Psbt({ network });
    psbt.addInput({
        hash: utxos[0].txid,
        index: utxos[0].vout,
        witnessUtxo: { value: utxos[0].value, script: Address.toOutputScript(address as string, network) },
    });

    psbt.addOutput({
        script: mintstone.encipher(),
        value: 0
    });

    psbt.addOutput({
        address: ord_address,
        value: 546
    });

    const fee = 5000;
    const change = utxos[0].value - fee - 546;

    psbt.addOutput({
        address: change_address,
        value: change
    });

    await signAndSend(keyPair, psbt, address as string);
}
