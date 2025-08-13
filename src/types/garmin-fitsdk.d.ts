declare module '@garmin/fitsdk' {
  export class Stream {
    static fromByteArray(bytes: Uint8Array): Stream;
  }
  
  export class Decoder {
    constructor(stream: Stream);
    checkIntegrity(): boolean;
    read(): any[];
  }
}