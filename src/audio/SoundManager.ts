const SOUND_FILES = {
  button: "/assets/sounds/button.wav",
  spin: "/assets/sounds/spin_sound.wav",
  win: "/assets/sounds/win_sound.wav",
  lose: "/assets/sounds/Loose.wav",
  background: "/assets/sounds/Background.wav",
} as const;

export type SoundName = keyof typeof SOUND_FILES;

const BACKGROUND_VOLUME: number = 0.3;
const EFFECTS_VOLUME: number = 1.0;

/**
 * SoundManager loads all sounds via the Web Audio API and provides
 * simple play / stop methods. The AudioContext is resumed on first
 * interaction automatically — no special setup needed at the call site.
 */
export class SoundManager {
  private readonly context: AudioContext;
  private readonly buffers: Map<SoundName, AudioBuffer>;
  private backgroundSource: AudioBufferSourceNode | null;

  constructor() {
    this.context = new AudioContext();
    this.buffers = new Map();
    this.backgroundSource = null;
  }

  public async load(): Promise<void> {
    const names = Object.keys(SOUND_FILES) as SoundName[];

    for (const name of names) {
      const response: Response = await fetch(SOUND_FILES[name]);
      const arrayBuffer: ArrayBuffer = await response.arrayBuffer();
      const audioBuffer: AudioBuffer =
        await this.context.decodeAudioData(arrayBuffer);
      this.buffers.set(name, audioBuffer);
    }
  }

  public play(name: SoundName): void {
    const buffer: AudioBuffer | undefined = this.buffers.get(name);
    if (!buffer) return;

    this.resume();

    const source: AudioBufferSourceNode = this.context.createBufferSource();
    const gain: GainNode = this.context.createGain();

    source.buffer = buffer;
    gain.gain.value = EFFECTS_VOLUME;

    source.connect(gain);
    gain.connect(this.context.destination);
    source.start();
  }

  public playBackground(): void {
    const buffer: AudioBuffer | undefined = this.buffers.get("background");
    if (!buffer || this.backgroundSource) return;

    this.resume();

    const source: AudioBufferSourceNode = this.context.createBufferSource();
    const gain: GainNode = this.context.createGain();

    source.buffer = buffer;
    source.loop = true;
    gain.gain.value = BACKGROUND_VOLUME;

    source.connect(gain);
    gain.connect(this.context.destination);
    source.start();

    this.backgroundSource = source;
  }

  public stopBackground(): void {
    if (!this.backgroundSource) return;
    this.backgroundSource.stop();
    this.backgroundSource = null;
  }

  private resume(): void {
    if (this.context.state === "suspended") {
      this.context.resume();
    }
  }
}
