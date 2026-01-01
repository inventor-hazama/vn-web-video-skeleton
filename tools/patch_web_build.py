#!/usr/bin/env python3
"""
tools/patch_web_build.py

Injects the HTML video layer into a Ren'Py Web build output directory.

Usage:
  python tools/patch_web_build.py /path/to/web_build_output

It will:
- Copy web_patch/video_layer.js and video_layer.css into the output directory.
- Inject the snippet before </body> in index.html (idempotent).
"""

import os, sys, shutil, re

SNIPPET_MARKER = "<!-- Injected by tools/patch_web_build.py -->"

def read_file(p):
    with open(p, "r", encoding="utf-8") as f:
        return f.read()

def write_file(p, s):
    with open(p, "w", encoding="utf-8") as f:
        f.write(s)

def main():
    if len(sys.argv) != 2:
        print("Usage: python tools/patch_web_build.py /path/to/web_build_output")
        return 2

    out_dir = sys.argv[1]
    index_path = os.path.join(out_dir, "index.html")
    if not os.path.isfile(index_path):
        print(f"index.html not found: {index_path}")
        return 2

    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    web_patch = os.path.join(repo_root, "web_patch")

    # Copy assets
    for name in ("video_layer.js", "video_layer.css"):
        src = os.path.join(web_patch, name)
        dst = os.path.join(out_dir, name)
        if not os.path.isfile(src):
            print(f"Missing source asset: {src}")
            return 2
        shutil.copy2(src, dst)

    # Inject snippet AFTER <body> (so video-layer is BEHIND canvas which comes later)
    html = read_file(index_path)
    if SNIPPET_MARKER not in html:
        snippet = read_file(os.path.join(web_patch, "index_inject_snippet.html"))

        # Insert right after <body> tag to place video-layer behind canvas
        if "<body>" in html:
            html = html.replace("<body>", "<body>\n" + snippet)
        else:
            html += "\n" + snippet + "\n"

        write_file(index_path, html)
        print("Patched index.html and copied assets.")
    else:
        print("index.html already patched. Skipping injection.")

    # Ensure canvas is transparent (Ren'Py default is background: #000)
    html = read_file(index_path)
    # Use regex to handle potential whitespace variations
    pattern = r'(#canvas\s*\{\s*background:\s*)#000(;\s*\})'
    if re.search(pattern, html):
        html = re.sub(pattern, r'\1transparent\2', html)
        write_file(index_path, html)
        print("Modified index.html CSS for canvas transparency via regex.")
    else:
        print("Canvas background CSS pattern not found (or already transparent).")

    # Copy movies folder because HTML5 Video cannot read from game.zip
    # Expected source: <repo>/vn_web_video/game/movies
    # Expected dest: <out_dir>/game/movies
    src_movies = os.path.join(repo_root, "vn_web_video", "game", "movies")
    dst_game = os.path.join(out_dir, "game")
    dst_movies = os.path.join(dst_game, "movies")

    if os.path.isdir(src_movies):
        print(f"Copying movies from {src_movies} to {dst_movies}...")
        if not os.path.exists(dst_game):
            os.makedirs(dst_game)
        
        # Simple copy: remove dest if exists to ensure clean state
        if os.path.exists(dst_movies):
            shutil.rmtree(dst_movies)
        
        shutil.copytree(src_movies, dst_movies)
        print("Movies copied successfully.")
    else:
        print(f"WARNING: Movies source not found at {src_movies}")

    return 0

if __name__ == "__main__":
    raise SystemExit(main())
