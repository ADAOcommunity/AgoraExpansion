declare module "blakejs" {
  export function blake2bHex(
    input: Uint8Array | ArrayLike<number> | ArrayBuffer,
    key?: Uint8Array | ArrayLike<number> | ArrayBuffer | null,
    outlen?: number
  ): string;

  const defaultExport: {
    blake2bHex: typeof blake2bHex;
  };

  export default defaultExport;
}
