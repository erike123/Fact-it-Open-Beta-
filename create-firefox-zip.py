#!/usr/bin/env python3
"""
Create Firefox-compatible ZIP with forward slashes
"""
import zipfile
import os
from pathlib import Path

def create_firefox_zip():
    dist_dir = Path('dist')
    output_zip = Path('fact-it-firefox-v0.1.0.zip')

    # Remove old zip if exists
    if output_zip.exists():
        output_zip.unlink()

    print(f"Creating Firefox ZIP: {output_zip}")

    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(dist_dir):
            # Skip .vite and src folders
            dirs[:] = [d for d in dirs if d not in ['.vite', 'src']]

            for file in files:
                file_path = Path(root) / file

                # Calculate relative path from dist/
                relative_path = file_path.relative_to(dist_dir)

                # Convert to string with forward slashes (POSIX style)
                arcname = str(relative_path).replace('\\', '/')

                print(f"  Adding: {arcname}")
                zipf.write(file_path, arcname)

    print(f"\n✅ Created: {output_zip}")
    print(f"   Size: {output_zip.stat().st_size / 1024 / 1024:.2f} MB")

    # Verify contents
    print("\n📦 Contents (first 25 files):")
    with zipfile.ZipFile(output_zip, 'r') as zipf:
        for i, name in enumerate(zipf.namelist()[:25]):
            print(f"   {name}")
        if len(zipf.namelist()) > 25:
            print(f"   ... and {len(zipf.namelist()) - 25} more files")

if __name__ == '__main__':
    create_firefox_zip()
