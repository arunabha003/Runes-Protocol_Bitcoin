import { Etching, EtchInscription, Runestone, none, some, Rune, Terms, Range, Taptree } from 'runelib';
import { ECPairFactory, ECPairAPI, TinySecp256k1Interface } from 'ecpair';
import { payments, Psbt, script } from 'bitcoinjs-lib';
import { toXOnly, waitUntilUTXO, signAndSend } from './utils/funs'; // Assuming these utilities are implemented

const tinysecp: TinySecp256k1Interface = require('tiny-secp256k1');
const ECPair: ECPairAPI = ECPairFactory(tinysecp);

async function etching(yourKey: string, network: any, ord_address: string, change_address: string) {
    const name = "CCCCCCCCCCCCCCCCCCNH";

    const keyPair = ECPair.fromWIF(yourKey, network);

    const ins = new EtchInscription();
    ins.setContent("text/plain", Buffer.from('scrypt is best', 'utf-8'));
    ins.setRune(name);

    const etching_script_asm = `${toXOnly(keyPair.publicKey).toString("hex")} OP_CHECKSIG`;
    const etching_script = Buffer.concat([script.fromASM(etching_script_asm), ins.encipher()]);

    const scriptTree: Taptree = {
        output: etching_script,
    };

    const script_p2tr = payments.p2tr({
        internalPubkey: toXOnly(keyPair.publicKey),
        scriptTree,
        network,
    });

    const etching_redeem = {
        output: etching_script,
        redeemVersion: 192
    };

    const etching_p2tr = payments.p2tr({
        internalPubkey: toXOnly(keyPair.publicKey),
        scriptTree,
        redeem: etching_redeem,
        network
    });

    const address = script_p2tr.address ?? "";
    console.log("send coin to address", address);

    const utxos = await waitUntilUTXO(address as string);
    console.log(`Using UTXO ${utxos[0].txid}:${utxos[0].vout}`);

    const psbt = new Psbt({ network });

    psbt.addInput({
        hash: utxos[0].txid,
        index: utxos[0].vout,
        witnessUtxo: { value: utxos[0].value, script: script_p2tr.output! },
        tapLeafScript: [
            {
                leafVersion: etching_redeem.redeemVersion,
                script: etching_redeem.output,
                controlBlock: etching_p2tr.witness![etching_p2tr.witness!.length - 1]
            }
        ]
    });

    const rune = Rune.fromName(name);
    const amount = 1000;
    const cap = 21000;
    const terms = new Terms(amount, cap, new Range(none(), none()), new Range(none(), none()));
    const symbol = "$";
    const premine = none();
    const divisibility = none();
    const etching = new Etching(divisibility, premine, some(rune), none(), some(symbol), some(terms), true);

    const stone = new Runestone([], some(etching), none(), none());

    psbt.addOutput({
        script: stone.encipher(),
        value: 0
    });

    const fee = 5000;
    const change = utxos[0].value - 546 - fee;

    psbt.addOutput({
        address: ord_address,
        value: 546
    });

    psbt.addOutput({
        address: change_address,
        value: change
    });

    await signAndSend(keyPair, psbt, address as string);
}
