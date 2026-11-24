"""Install or roll back a ready-made static release. Runs under the Jino SSH account."""
import ctypes
import fcntl
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import sys
import tarfile
import tempfile

RELEASE_ID = re.compile(r"[0-9]+-[0-9]+")
HOST_FILES = (".envrc", ".htaccess", ".well-known", ".user.ini")


def exchange(first, second):
    # Both names always resolve, including during the first publication over a real directory.
    rename = ctypes.CDLL(None, use_errno=True).renameat2
    rename.argtypes = (ctypes.c_int, ctypes.c_char_p, ctypes.c_int, ctypes.c_char_p, ctypes.c_uint)
    if rename(-100, os.fsencode(first), -100, os.fsencode(second), 2) != 0:  # RENAME_EXCHANGE
        code = ctypes.get_errno()
        raise OSError(code, os.strerror(code))


def identity(directory):
    marker = directory / "legato-release.json"
    if not marker.exists():
        return None
    value = json.loads(marker.read_text())["release"]
    if not isinstance(value, str) or not RELEASE_ID.fullmatch(value):
        raise ValueError("Invalid installed release marker")
    return value


def unpack(archive, target, digest):
    checksum = hashlib.sha256()
    with archive.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            checksum.update(block)
    if checksum.hexdigest() != digest:
        raise ValueError("Archive checksum mismatch")
    with tarfile.open(archive, "r:gz") as tar:
        for entry in tar:
            path = PurePosixPath(entry.name)
            if path.is_absolute() or any(part.startswith(".") for part in path.parts):
                raise ValueError("Invalid release path")
            destination = target.joinpath(*path.parts)
            if entry.isdir():
                destination.mkdir(parents=True, exist_ok=True)
            elif entry.isfile():
                destination.parent.mkdir(parents=True, exist_ok=True)
                with destination.open("xb") as out, tar.extractfile(entry) as src:
                    shutil.copyfileobj(src, out)
                destination.chmod(0o644)
            else:
                raise ValueError("Unexpected archive entry")


def preserve_host_files(live, next_tree):
    for name in HOST_FILES:
        source = live / name
        dest = next_tree / name
        if source.is_symlink():
            dest.symlink_to(os.readlink(source))
        elif source.is_dir():
            shutil.copytree(source, dest, symlinks=True)
        elif source.is_file():
            shutil.copy2(source, dest)


def operate(home, action, release, digest=None):
    if not RELEASE_ID.fullmatch(release) or action not in ("activate", "rollback"):
        raise ValueError("Invalid operation or release")
    live = home / "domains" / "legato-ui.ru"
    state = home / ".legato-site"
    versions = state / "versions"
    versions.mkdir(mode=0o700, parents=True, exist_ok=True)
    if live.is_symlink() or not live.is_dir() or live.stat().st_dev != versions.stat().st_dev:
        raise ValueError("The domain and release storage must be real directories on the same filesystem")
    previous = versions / release
    with (state / "deploy.lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        current = identity(live)
        if action == "rollback":
            if current == release:
                exchange(previous, live)
                print("Restored previous public directory")
            return
        if current == release:
            return
        if previous.exists():
            raise ValueError("Release ID was already used. Start a new release to publish again")
        if not digest or not re.fullmatch(r"[a-f0-9]{64}", digest):
            raise ValueError("Invalid checksum")
        archive = state / "incoming" / (release + ".tar.gz")
        with tempfile.TemporaryDirectory(dir=versions) as staging:
            candidate = Path(staging) / "site"
            candidate.mkdir()
            unpack(archive, candidate, digest)
            if identity(candidate) != release or not (candidate / "ru/docs/components/index.html").is_file():
                raise ValueError("Incomplete release or wrong identity")
            preserve_host_files(live, candidate)
            # A tab opened just before publication can still fetch its old lazy chunks.
            if current:
                old_assets = live / "_playground" / current
                if old_assets.is_dir():
                    shutil.copytree(old_assets, candidate / "_playground" / current, copy_function=os.link)
            shutil.copymode(live, candidate)
            candidate.rename(previous)
            try:
                exchange(previous, live)
            except BaseException:
                previous.rename(candidate)
                raise
        archive.unlink()
        print("Activated release " + release)


if __name__ == "__main__":
    os.umask(0o022)
    operate(Path.home(), *sys.argv[1:])
