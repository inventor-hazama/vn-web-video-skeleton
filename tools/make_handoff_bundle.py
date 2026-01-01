#!/usr/bin/env python3
"""
tools/make_handoff_bundle.py

Creates a minimal handoff zip for Codex/Antigravity based on HANDOFF/MANIFEST.txt.

Usage:
  python tools/make_handoff_bundle.py output.zip
"""
import os, sys, zipfile

def main():
    if len(sys.argv) != 2:
        print("Usage: python tools/make_handoff_bundle.py output.zip")
        return 2

    out_zip = sys.argv[1]
    repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    manifest_path = os.path.join(repo_root, "HANDOFF", "MANIFEST.txt")

    with open(manifest_path, "r", encoding="utf-8") as f:
        files = [line.strip() for line in f if line.strip() and not line.strip().startswith("#")]

    with zipfile.ZipFile(out_zip, "w", compression=zipfile.ZIP_DEFLATED) as z:
        for rel in files:
            src = os.path.join(repo_root, rel)
            if os.path.isfile(src):
                z.write(src, arcname=rel)
            else:
                print(f"Warning: missing {rel}")

    print(f"Created {out_zip}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
