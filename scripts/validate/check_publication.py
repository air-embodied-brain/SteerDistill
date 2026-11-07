"""Scan an extracted source release without printing matched private values."""
import re
import sys
from pathlib import Path

ROOT = Path(sys.argv[1]).resolve()
PATTERNS = {
    "private key": r"BEGIN (?:OPENSSH|RSA|EC|DSA) PRIVATE KEY",
    "credential": r"(?:AKIA[0-9A-Z]{16}|sk-[\w-]{32,}|gh[pousr]_[A-Za-z0-9]{25,})",
    "machine path": r"/(?:Users|home|mnt|root|remote-home)/[\w.-]+",
    "private address": r"(?<![\d.])(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?![\d.])",
    "URL credential": r"https?://[^\s/:]+:[^\s/@]+@",
}
failures = []
for path in sorted(ROOT.rglob("*")):
    relative = path.relative_to(ROOT)
    if ".git" in relative.parts:
        continue
    if path.is_symlink():
        failures.append(f"{relative}: symlinks are not release sources")
        continue
    if not path.is_file():
        continue
    try:
        value = path.read_text(encoding="utf-8")
    except UnicodeError:
        continue
    for label, pattern in PATTERNS.items():
        match = re.search(pattern, value)
        if match:
            line = value.count("\n", 0, match.start()) + 1
            failures.append(f"{relative}:{line}: {label}")
for failure in failures:
    print(failure, file=sys.stderr)
if failures:
    raise SystemExit(2)
print("PASS: source privacy scan (matched values are never printed)")
