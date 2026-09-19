export const extractVoicePrint = async (blob) => {
  const arrayBuffer = await blob.arrayBuffer();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  try {
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    const channel = audioBuffer.getChannelData(0);

    // Overall RMS — if too low, we treat this as silence and refuse
    let totalSum = 0;
    for (let i = 0; i < channel.length; i++) {
      totalSum += channel[i] * channel[i];
    }
    const overallRms = Math.sqrt(totalSum / channel.length);

    // Threshold: 0.01 is a reasonable floor for a real voice clip
    if (overallRms < 0.01) {
      throw new Error("silent");
    }

    const bins = 20;
    const blockSize = Math.floor(channel.length / bins);
    const peaks = [];
    for (let i = 0; i < bins; i++) {
      let sum = 0;
      const start = i * blockSize;
      for (let j = 0; j < blockSize; j++) {
        const s = channel[start + j] || 0;
        sum += s * s;
      }
      const rms = Math.sqrt(sum / blockSize);
      peaks.push(rms);
    }
    const max = Math.max(...peaks, 0.0001);
    return peaks.map((v) => Math.min(1, v / max));
  } finally {
    ctx.close();
  }
};

export const compareVoicePrints = (a, b) => {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0,
    magA = 0,
    magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
};

// Live mic-level meter — returns { level, stop }
// level is a function returning current RMS [0, 1]
export const createLevelMeter = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  const source = ctx.createMediaStreamSource(stream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 512;
  source.connect(analyser);

  const data = new Uint8Array(analyser.fftSize);

  const level = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    return Math.min(1, rms * 4); // scale for a lively meter
  };

  const stop = () => {
    try {
      source.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      ctx.close();
    } catch {}
  };

  return { level, stop };
};

export const createRecorder = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const recorder = new MediaRecorder(stream);
  const chunks = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };
  return {
    start: () => recorder.start(),
    stop: () =>
      new Promise((resolve) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: "audio/webm" });
          resolve(blob);
        };
        recorder.stop();
      }),
  };
};