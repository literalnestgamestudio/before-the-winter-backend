"""Generates Sources/Audio/wheel_spin.wav: decelerating pointer ticks + final win chime.
Pure stdlib. Usage: python gen_wheel_spin.py [duration_seconds]
Set duration to match the wheel's spin animation in Unity (default 4.0s of ticks + 0.8s chime).
"""
import math, random, struct, sys, wave, os

SR = 44100
SPIN = float(sys.argv[1]) if len(sys.argv) > 1 else 4.0
TAIL = 0.9
N = int((SPIN + TAIL) * SR)
buf = [0.0] * N
random.seed(7)

def add_tick(t, vol):
    # short woody click: filtered noise burst + low thump, fast decay
    start = int(t * SR)
    length = int(0.045 * SR)
    lp = 0.0
    for i in range(length):
        if start + i >= N:
            break
        env = math.exp(-i / (SR * 0.006))
        lp += 0.35 * ((random.random() * 2 - 1) - lp)
        s = lp * env * 0.9 + math.sin(2 * math.pi * 1400 * i / SR) * env * 0.35
        s += math.sin(2 * math.pi * 220 * i / SR) * math.exp(-i / (SR * 0.012)) * 0.5
        buf[start + i] += s * vol

# Tick times: angular velocity decays (ease-out), tick on each peg passed.
total_pegs = 40
t_prev = 0.0
for k in range(1, total_pegs + 1):
    p = k / total_pegs                      # progress 0..1 in angle
    t = SPIN * (1 - (1 - p) ** (1 / 3))     # inverse of cubic ease-out angle(t)=1-(1-t/T)^3
    add_tick(t, 0.55 + 0.35 * (1 - p) ** 0.5 if k < total_pegs else 0.9)

# Final chime (win) shortly after the last tick
def add_chime(t0, freq, vol, dur=0.8):
    start = int(t0 * SR)
    for i in range(int(dur * SR)):
        if start + i >= N:
            break
        env = math.exp(-i / (SR * 0.25)) * min(1, i / (SR * 0.004))
        s = math.sin(2 * math.pi * freq * i / SR) + 0.3 * math.sin(2 * math.pi * freq * 2.01 * i / SR)
        buf[start + i] += s * env * vol

add_chime(SPIN + 0.05, 880.0, 0.22)
add_chime(SPIN + 0.14, 1318.5, 0.2)
add_chime(SPIN + 0.25, 1760.0, 0.16)

peak = max(abs(x) for x in buf) or 1
scale = 0.85 / peak
out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Audio")
os.makedirs(out_dir, exist_ok=True)
path = os.path.join(out_dir, "wheel_spin.wav")
with wave.open(path, "wb") as w:
    w.setnchannels(1)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(b"".join(struct.pack("<h", int(max(-1, min(1, x * scale)) * 32767)) for x in buf))
print(path, f"{N / SR:.2f}s")
