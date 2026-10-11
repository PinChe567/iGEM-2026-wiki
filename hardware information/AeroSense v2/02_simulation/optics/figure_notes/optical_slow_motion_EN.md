# optical_slow_motion · Synchronized optical movie

## Publication caption

NE sampled optical paths and four LED state indicators share one time clock with ideal, received, overlaid and residual detector traces. Playback is 100× slow; the 20-second movie covers 0.2 seconds of modulation.

## Generation and assumptions

Frame k uses sample round(k×4000/(10×100)). The LED states, visible NE paths, trace endpoints and cursor all read that sample. Frame zero displays sample zero in every panel; no future samples are revealed. There are 200 frames at 10 fps, from t=0 to 199 ms, with the final frame held for the remaining 1 ms of physical time.

## Results

The earlier moving-window display exposed a future 0–60 ms trace while the schematic advanced, creating an apparent delay. The fixed window now reveals history only through the current sample. This is a display correction, not a change to photon flight physics or CAD.

## How to read: axes and legends

A: actual NE trajectories only; other LEDs have synchronized state markers but no mirrored rays. B: ideal; C: conditional received; D: green/orange overlay; E: purple residual. Each signal x-axis is 0–200 ms and the vertical cursor marks the common time. Y units are green-equivalent nW; residual uses its own range. The purple PD cross marks (0,−0.4,40.5) mm.

## Limitations

Paths switch together at the LED state; there are no traveling photon dots or fabricated millisecond flight delay. Useful reflected fluorescence remains in ideal; same-frequency excitation contamination remains in received. The movie is neither a cell-response measurement nor a complete electronic timing model. The GIF and MP4 use the same 200 frame times.

## Data and reproduction

results/video_frame_alignment.json; results/video_metadata.json; results/animation_paths.json; results/frequency_traces.npz; publication.py render_frame()/video()

```text
python run.py --plots
python run.py --plots --video --ffmpeg C:/path/to/ffmpeg.exe
```
