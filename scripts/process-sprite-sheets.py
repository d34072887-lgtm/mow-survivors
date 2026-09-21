"""Chroma-key and slice AI sprite sheets into game-ready assets."""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1] / "assets"


def chroma_key(im: Image.Image, key=(255, 0, 255), tol: int = 40) -> Image.Image:
    im = im.convert("RGBA")
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if (
                abs(r - key[0]) <= tol
                and abs(g - key[1]) <= tol
                and abs(b - key[2]) <= tol
            ):
                px[x, y] = (r, g, b, 0)
    return im


def find_blobs(im: Image.Image, min_pixels: int = 500) -> list[tuple[int, int, int, int]]:
    """Return blob bboxes (x0, y0, x1, y1) in reading order."""
    import numpy as np

    alpha = np.array(im.split()[3])
    h, w = alpha.shape
    visited = np.zeros_like(alpha, dtype=bool)
    blobs: list[tuple[int, int, int, int, int]] = []

    for y in range(h):
        for x in range(w):
            if alpha[y, x] <= 10 or visited[y, x]:
                continue
            stack = [(x, y)]
            visited[y, x] = True
            minx = maxx = x
            miny = maxy = y
            count = 0
            while stack:
                cx, cy = stack.pop()
                count += 1
                minx = min(minx, cx)
                maxx = max(maxx, cx)
                miny = min(miny, cy)
                maxy = max(maxy, cy)
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if (
                        0 <= nx < w
                        and 0 <= ny < h
                        and not visited[ny, nx]
                        and alpha[ny, nx] > 10
                    ):
                        visited[ny, nx] = True
                        stack.append((nx, ny))
            if count >= min_pixels:
                blobs.append((minx, miny, maxx + 1, maxy + 1, count))

  # sort by row band then x
    row_h = h / max(1, int(round(len(blobs) ** 0.5)))
    blobs.sort(key=lambda b: (int(((b[1] + b[3]) / 2) / row_h), b[0]))
    return [(b[0], b[1], b[2], b[3]) for b in blobs]


def group_blobs_into_rows(
    blobs: list[tuple[int, int, int, int]], num_rows: int, img_h: int
) -> list[list[tuple[int, int, int, int]]]:
    row_h = img_h / num_rows
    rows: list[list[tuple[int, int, int, int]]] = [[] for _ in range(num_rows)]
    for blob in blobs:
        cy = (blob[1] + blob[3]) / 2
        ri = min(int(cy / row_h), num_rows - 1)
        rows[ri].append(blob)
    for row in rows:
        row.sort(key=lambda b: b[0])
    return rows


def export_blob_frames(
    im: Image.Image,
    rows: list[list[tuple[int, int, int, int]]],
    frames_dir: Path,
    name_fn,
) -> tuple[dict, dict]:
    """Export trimmed frames; manifest uses trim rects on full sheet."""
    frames_dir.mkdir(parents=True, exist_ok=True)
    manifest_frames: dict = {}
    animations: dict = {}

    for row_idx, row in enumerate(rows):
        anim_names: list[str] = []
        for col_idx, box in enumerate(row):
            name = name_fn(row_idx, col_idx)
            x0, y0, x1, y1 = box
            fw, fh = x1 - x0, y1 - y0
            crop = im.crop(box)
            crop.save(frames_dir / f"{name}.png")
            manifest_frames[name] = {
                "frame": {"x": x0, "y": y0, "w": fw, "h": fh},
                "sourceSize": {"w": fw, "h": fh},
                "pivot": {"x": 0.5, "y": 0.92},
            }
            anim_names.append(name)
        animations[row_idx] = anim_names

    return manifest_frames, animations


def process_hero(src: Path) -> None:
    hero_dir = ROOT / "characters" / "hero_xiaokui"
    hero_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, hero_dir / "walk-sheet-raw.png")
    hero_raw = Image.open(src)
    hero_clean = chroma_key(hero_raw)
    hero_clean.save(hero_dir / "walk-sheet.png")

    blobs = find_blobs(hero_clean)
    if len(blobs) != 16:
        raise RuntimeError(f"hero: expected 16 blobs, got {len(blobs)}")

    row_groups = group_blobs_into_rows(blobs, 4, hero_clean.size[1])
    row_dirs = ["down", "left", "right", "up"]
    frames_dir = hero_dir / "frames"

    manifest_frames: dict = {}
    hero_animations: dict = {}
    for row_idx, row in enumerate(row_groups):
        if len(row) != 4:
            raise RuntimeError(f"hero row {row_idx}: expected 4 blobs, got {len(row)}")
        anim_key = f"walk_{row_dirs[row_idx]}"
        hero_animations[anim_key] = []
        for col_idx, box in enumerate(row):
            name = f"{anim_key}_{col_idx}"
            x0, y0, x1, y1 = box
            fw, fh = x1 - x0, y1 - y0
            hero_clean.crop(box).save(frames_dir / f"{name}.png")
            manifest_frames[name] = {
                "frame": {"x": x0, "y": y0, "w": fw, "h": fh},
                "sourceSize": {"w": fw, "h": fh},
                "pivot": {"x": 0.5, "y": 0.92},
            }
            hero_animations[anim_key].append(name)

    hero_manifest = {
        "id": "hero_xiaokui",
        "displayName": "小葵",
        "view": "topdown",
        "style": "pixel_inspired",
        "sheet": {
            "image": "walk-sheet.png",
            "rawImage": "walk-sheet-raw.png",
            "sliceMode": "blob_trim",
            "columns": 4,
            "rows": 4,
            "size": {"w": hero_raw.size[0], "h": hero_raw.size[1]},
        },
        "animations": {
            k: {"frames": v, "frameRate": 8, "repeat": -1}
            for k, v in hero_animations.items()
        },
        "frames": manifest_frames,
        "notes": "AI sheet 未对齐网格，manifest 使用连通域 trim。Row0=down, row1=left, row2=right, row3=up（row1/2 按实图朝向校正）.",
    }
    (hero_dir / "manifest.json").write_text(
        json.dumps(hero_manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("hero", hero_raw.size, "blobs=16", "trim ok")


def process_slime(src: Path) -> None:
    slime_dir = ROOT / "monsters" / "slime"
    slime_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, slime_dir / "idle-sheet-raw.png")
    slime_raw = Image.open(src)
    slime_clean = chroma_key(slime_raw)
    slime_clean.save(slime_dir / "idle-sheet.png")

    blobs = find_blobs(slime_clean)
    if len(blobs) != 4:
        raise RuntimeError(f"slime: expected 4 blobs, got {len(blobs)}")

    row_groups = group_blobs_into_rows(blobs, 2, slime_clean.size[1])
    frames_dir = slime_dir / "frames"
    manifest_frames: dict = {}
    slime_idle: list[str] = []

    for row_idx, row in enumerate(row_groups):
        if len(row) != 2:
            raise RuntimeError(f"slime row {row_idx}: expected 2 blobs, got {len(row)}")
        for col_idx, box in enumerate(row):
            idx = row_idx * 2 + col_idx
            name = f"idle_{idx}"
            x0, y0, x1, y1 = box
            fw, fh = x1 - x0, y1 - y0
            slime_clean.crop(box).save(frames_dir / f"{name}.png")
            manifest_frames[name] = {
                "frame": {"x": x0, "y": y0, "w": fw, "h": fh},
                "sourceSize": {"w": fw, "h": fh},
                "pivot": {"x": 0.5, "y": 0.88},
            }
            slime_idle.append(name)

    slime_manifest = {
        "id": "slime",
        "displayName": "史莱姆",
        "view": "topdown",
        "style": "pixel_inspired",
        "sheet": {
            "image": "idle-sheet.png",
            "rawImage": "idle-sheet-raw.png",
            "sliceMode": "blob_trim",
            "columns": 2,
            "rows": 2,
            "size": {"w": slime_raw.size[0], "h": slime_raw.size[1]},
        },
        "animations": {
            "idle": {"frames": slime_idle, "frameRate": 6, "repeat": -1},
        },
        "frames": manifest_frames,
        "notes": "2x2 idle via blob trim. Play order idle_0→idle_3.",
    }
    (slime_dir / "manifest.json").write_text(
        json.dumps(slime_manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("slime", slime_raw.size, "blobs=4", "trim ok")


if __name__ == "__main__":
    process_hero(
        Path(r"C:\Users\1\.cursor\projects\d\assets\hero-xiaokui-walk-4x4-raw.png")
    )
    process_slime(
        Path(r"C:\Users\1\.cursor\projects\d\assets\monster-slime-idle-2x2-raw.png")
    )
    print("done")
