#!/usr/bin/env node
/**
 * excalidraw.com share-link codec.
 *
 *   node excalidraw_share.mjs publish <file.excalidraw>   -> prints a share URL
 *   node excalidraw_share.mjs fetch   <url|id,key>        -> prints the scene JSON
 *
 * Wire format (verified by round-trip against live excalidraw.com blobs):
 *
 *   outer:  [u32 version=1][u32 len][fileInfo json]
 *           [u32 12][iv][u32 len][ciphertext]
 *   cipher: AES-128-GCM, key = the 16 bytes base64url-encoded as the
 *           second field of the URL fragment "#json=<id>,<key>"
 *   plain:  zlib-deflated ("pako@1") bytes of the inner frame
 *   inner:  [u32 version=1][u32 len][metadata json][u32 len][scene json]
 *
 * The nesting is the part that bites: it is NOT a bare [iv][ciphertext].
 * Getting it wrong surfaces as "unable to authenticate data".
 *
 * No dependencies — node's crypto and zlib only.
 */
import { readFileSync } from "node:fs";
import { webcrypto, getRandomValues } from "node:crypto";
import { deflateSync, inflateSync } from "node:zlib";

const API = "https://json.excalidraw.com/api/v2";
const FILE_INFO = { version: 2, compression: "pako@1", encryption: "AES-GCM" };
const META = { version: "2", type: "excalidraw" };

const b64url = {
  encode: (buf) => Buffer.from(buf).toString("base64url"),
  decode: (str) => Buffer.from(str, "base64url"),
};

// ---- frame helpers ----------------------------------------------------
function u32(n) {
  const b = Buffer.alloc(4);
  b.writeUInt32BE(n, 0);
  return b;
}

/** [u32 version][u32 len][chunk]... */
function frame(version, ...chunks) {
  const parts = [u32(version)];
  for (const c of chunks) {
    const b = Buffer.from(c);
    parts.push(u32(b.length), b);
  }
  return Buffer.concat(parts);
}

/** Reads `count` length-prefixed chunks after the leading version word. */
function unframe(buf, count) {
  let off = 4; // skip version
  const out = [];
  for (let i = 0; i < count; i++) {
    const len = buf.readUInt32BE(off);
    off += 4;
    out.push(buf.subarray(off, off + len));
    off += len;
  }
  return out;
}

// ---- crypto -----------------------------------------------------------
const importKey = (raw, use) =>
  webcrypto.subtle.importKey("raw", raw, "AES-GCM", false, [use]);

async function encrypt(plaintext) {
  const raw = Buffer.from(getRandomValues(new Uint8Array(16)));
  const iv = Buffer.from(getRandomValues(new Uint8Array(12)));
  const key = await importKey(raw, "encrypt");
  const ct = await webcrypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return { raw, iv, ciphertext: Buffer.from(ct) };
}

async function decrypt(raw, iv, ciphertext) {
  const key = await importKey(raw, "decrypt");
  const pt = await webcrypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return Buffer.from(pt);
}

// ---- public API -------------------------------------------------------
export async function publish(scene) {
  const inner = frame(1, JSON.stringify(META), JSON.stringify(scene));
  const { raw, iv, ciphertext } = await encrypt(deflateSync(inner));
  const body = Buffer.concat([
    frame(1, JSON.stringify(FILE_INFO)),
    u32(iv.length),
    iv,
    u32(ciphertext.length),
    ciphertext,
  ]);

  const res = await fetch(`${API}/post/`, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream" },
    body,
  });
  if (!res.ok) throw new Error(`POST ${API}/post/ -> ${res.status} ${await res.text()}`);

  const json = await res.json();
  const id = json.id ?? String(json.data ?? "").split("/").pop();
  if (!id) throw new Error(`no id in response: ${JSON.stringify(json)}`);
  return `https://excalidraw.com/#json=${id},${b64url.encode(raw)}`;
}

export async function fetchScene(ref) {
  const m = ref.match(/#json=([^,]+),(.+)$/) ?? ref.match(/^([^,]+),(.+)$/);
  if (!m) throw new Error(`not a share reference: ${ref}`);
  const [, id, keyStr] = m;

  const res = await fetch(`${API}/${id}`);
  if (!res.ok) throw new Error(`GET ${API}/${id} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  // outer: version, then fileInfo / iv / ciphertext, each length-prefixed
  const [fileInfo, iv, ciphertext] = unframe(buf, 3);
  const info = JSON.parse(fileInfo.toString());
  if (info.encryption !== "AES-GCM") throw new Error(`unexpected encryption: ${info.encryption}`);

  const plain = inflateSync(await decrypt(b64url.decode(keyStr), iv, ciphertext));
  const [, sceneJson] = unframe(plain, 2);
  return JSON.parse(sceneJson.toString());
}

// ---- cli --------------------------------------------------------------
const [, , cmd, arg] = process.argv;
if (cmd === "publish") {
  console.log(await publish(JSON.parse(readFileSync(arg, "utf8"))));
} else if (cmd === "fetch") {
  console.log(JSON.stringify(await fetchScene(arg), null, 2));
} else if (cmd) {
  console.error("usage: excalidraw_share.mjs publish <file.excalidraw> | fetch <url>");
  process.exit(2);
}
