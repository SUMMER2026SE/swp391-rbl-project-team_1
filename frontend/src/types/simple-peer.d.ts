declare module "simple-peer" {
  import { Duplex } from "stream";

  interface Options {
    initiator?: boolean;
    channelConfig?: object;
    channelName?: string;
    config?: object;
    constraints?: object;
    offerConstraints?: object;
    answerConstraints?: object;
    sdpTransform?: (sdp: string) => string;
    stream?: MediaStream;
    streams?: MediaStream[];
    trickle?: boolean;
    allowHalfTrickle?: boolean;
    wrtc?: object;
    objectMode?: boolean;
  }

  class Peer extends Duplex {
    constructor(opts?: Options);
    signal(data: any): void;
    send(data: any): void;
    destroy(err?: any): void;
    
    // Custom events
    on(event: "signal", listener: (data: any) => void): this;
    on(event: "connect", listener: () => void): this;
    on(event: "data", listener: (data: any) => void): this;
    on(event: "stream", listener: (stream: MediaStream) => void): this;
    on(event: "track", listener: (track: MediaStreamTrack, stream: MediaStream) => void): this;
    on(event: "close", listener: () => void): this;
    on(event: "error", listener: (err: any) => void): this;
  }

  export default Peer;
}
