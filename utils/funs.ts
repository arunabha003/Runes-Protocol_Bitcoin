
import { Psbt } from 'bitcoinjs-lib';
import { ECPairFactory, ECPairAPI, ECPairInterface, TinySecp256k1Interface } from 'ecpair';

const tinysecp: TinySecp256k1Interface = require('tiny-secp256k1');


/**
 * Converts a full 33-byte public key to a 32-byte X-only public key.
 * @param pubkey - The full public key (33 bytes)
 * @returns The X-only public key (32 bytes)
 */
export function toXOnly(pubkey: Buffer): Buffer {
    return pubkey.slice(1, 33); // Drop the first byte to get the x-only key.
}

import axios from 'axios';

/**
 * Waits until UTXOs are detected for the given Bitcoin address.
 * @param address - The Bitcoin address to monitor
 * @returns A promise that resolves with the UTXOs once they are detected
 */
export async function waitUntilUTXO(address: string): Promise<any> {
    while (true) {
        try {
            const response = await axios.get(`https://blockstream.info/api/address/${address}/utxo`);
            const utxos = response.data;

            if (utxos.length > 0) {
                return utxos; // Return the UTXOs once they are found
            }

            // Wait for some time before trying again (e.g., 10 seconds)
            await new Promise(resolve => setTimeout(resolve, 10000));
        } catch (error) {
            console.error("Error fetching UTXOs:", error);
            // Retry after delay in case of error
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }
}


/**
 * Signs a PSBT with the provided key pair and broadcasts it to the Bitcoin network.
 * @param keyPair - The ECPair used for signing
 * @param psbt - The PSBT to be signed and broadcasted
 * @param address - The address to send the signed transaction to
 * @returns The transaction ID of the broadcasted transaction
 */
export async function signAndSend(keyPair: any, psbt: Psbt, address: string): Promise<string> {
    // Sign all inputs
    psbt.signAllInputs(keyPair);

    // Finalize the transaction
    psbt.finalizeAllInputs();

    // Get the raw transaction hex
    const txHex = psbt.extractTransaction().toHex();

    // Broadcast the transaction to the Bitcoin network using an API
    const response = await axios.post('https://blockstream.info/api/tx', txHex);

    return response.data; // Returns the transaction ID (txid)
}






const ECPair: ECPairAPI = ECPairFactory(tinysecp);

/**
 * Tweaks the signer's private key by adding a tweak to it.
 * @param keyPair - The original ECPair to be tweaked
 * @param tweak - The tweak value (Buffer)
 * @returns A new ECPair instance with the tweaked private key
 */
export function tweakSigner(keyPair: ECPairInterface, tweak: Buffer): ECPairInterface {
    const tweakedPrivateKey = tinysecp.privateAdd(keyPair.privateKey!, tweak);

    if (!tweakedPrivateKey) {
        throw new Error('Invalid tweak or private key');
    }

    return ECPair.fromPrivateKey(Buffer.from(tweakedPrivateKey), {
        network: keyPair.network,
    });
}


