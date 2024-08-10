import { Runestone, RuneId, Edict, none, some } from 'runelib';
import { ECPairFactory, ECPairAPI, TinySecp256k1Interface } from 'ecpair';
import { payments, Psbt } from 'bitcoinjs-lib';
import * as crypto from 'crypto';
import { toXOnly, tweakSigner, waitUntilUTXO, signAndSend } from './utils/funs'; // Assuming these utilities are implemented

const tinysecp: TinySecp256k1Interface = require('tiny-secp256k1');
const ECPair: ECPairAPI = ECPairFactory(tinysecp);

async function transfer(yourKey: string, network: any, ord_address: string, change_address: string, receiver_ord_address: string) {
    const keyPair = ECPair.fromWIF(yourKey, network);
    const tweakedSigner = tweakSigner(keyPair, { network });

    const p2pktr = payments.p2tr({
        pubkey: toXOnly(tweakedSigner.publicKey),
        network
    });

    const address = p2pktr.address ?? "";
    console.log(`Waiting till UTXO is detected at this Address: ${address}`);

    const utxos = await waitUntilUTXO(address as string);

    const psbt = new Psbt({ network });

    for (let i = 0; i < utxos.length; i++) {
        const utxo = utxos[i];

        psbt.addInput({
            hash: utxo.txid,
            index: utxo.vout,
            witnessUtxo: { value: utxo.value, script: p2pktr.output! },
            tapInternalKey: toXOnly(keyPair.publicKey)
        });
    }

    const edicts: Array<Edict> = [];
    const edict: Edict = new Edict(new RuneId(2586233, 1009), 100n, 1 /*receiving runes at 1st output*/);
    edicts.push(edict);

    const mintstone = new Runestone(edicts, none(), none(), some(2 /*receiving change runes at 2nd output*/));

    psbt.addOutput({
        script: mintstone.encipher(),
        value: 0
    });

    psbt.addOutput({
        address: ord_address,
        value: 546
    });

    psbt.addOutput({
        address: receiver_ord_address,
        value: 546
    });

    const fee = 6000;

    const change = utxos.reduce((acc, utxo) => acc + utxo.value, 0) - fee - 546 * 2;

    psbt.addOutput({
        address: change_address,
        value: change
    });

    await signAndSend(tweakedSigner, psbt, address as string);
}
