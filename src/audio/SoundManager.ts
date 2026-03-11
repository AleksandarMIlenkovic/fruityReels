const SOUND_FILES = {
  button: "assets/sounds/button.mp3",
  spin: "assets/sounds/spin_sound.mp3",
  win: "assets/sounds/win_sound.mp3",
  lose: "assets/sounds/Loose.mp3",
  background: "assets/sounds/Background.mp3",
} as const;

export type SoundName = keyof typeof SOUND_FILES;

const BACKGROUND_VOLUME: number = 0.3;
const EFFECTS_VOLUME: number = 1.0;

export class SoundManager {
  private readonly context: AudioContext;
  private readonly buffers: Map<SoundName, AudioBuffer>;
  private backgroundSource: AudioBufferSourceNode | null = null;

  constructor() {
    this.context = new AudioContext();
    this.buffers = new Map();
  }

  public async load(): Promise<void> {
    const base: string = import.meta.env.BASE_URL;
    const names = Object.keys(SOUND_FILES) as SoundName[];

    const entries = await Promise.all(
      names.map(async (name) => {
        const response = await fetch(`${base}${SOUND_FILES[name]}`);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
        return [name, audioBuffer] as const;
      }),
    );

    for (const [name, buffer] of entries) {
      this.buffers.set(name, buffer);
    }
  }

  public play(name: SoundName): void {
    const buffer = this.buffers.get(name);
    if (!buffer) return;
    this.resume();
    this.createSource(buffer, EFFECTS_VOLUME, false);
  }

  public playBackground(): void {
    const buffer = this.buffers.get("background");
    if (!buffer || this.backgroundSource) return;
    this.resume();
    this.backgroundSource = this.createSource(buffer, BACKGROUND_VOLUME, true);
  }

  public stopBackground(): void {
    if (!this.backgroundSource) return;
    this.backgroundSource.stop();
    this.backgroundSource = null;
  }

  private createSource(
    buffer: AudioBuffer,
    volume: number,
    loop: boolean,
  ): AudioBufferSourceNode {
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();

    source.buffer = buffer;
    source.loop = loop;
    gain.gain.value = volume;

    source.connect(gain);
    gain.connect(this.context.destination);
    source.start();

    return source;
  }

  private resume(): void {
    if (this.context.state === "suspended") {
      void this.context.resume();
    }
  }
}
