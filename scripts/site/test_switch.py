import hashlib
import io
from pathlib import Path
import sys
import tarfile
import tempfile
import unittest

sys.dont_write_bytecode = True
from switch import identity, operate


class ReleaseSwitchTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.home = Path(self.temp.name)
        self.live = self.home / "domains/legato-ui.ru"
        self.live.mkdir(parents=True)
        (self.live / "index.html").write_text("original")
        (self.live / ".envrc").write_text("host-owned")

    def archive(self, name, extra=()):
        path = self.home / ".legato-site/incoming" / (name + ".tar.gz")
        path.parent.mkdir(parents=True, exist_ok=True)
        files = [("index.html", name), ("ru/docs/components/index.html", name),
                 ("legato-release.json", '{"release":"' + name + '"}'), ("_playground/" + name + "/assets/chunk.js", name)]
        with tarfile.open(path, "w:gz") as tar:
            for filename, data in files + list(extra):
                content = data.encode()
                info = tarfile.TarInfo(filename)
                info.size = len(content)
                tar.addfile(info, io.BytesIO(content))
        return hashlib.sha256(path.read_bytes()).hexdigest()

    def test_two_releases_and_rollback_to_original(self):
        for name in ["1-1", "2-1"]:
            digest = self.archive(name)
            operate(self.home, "activate", name, digest)
            operate(self.home, "activate", name, digest)
            self.assertEqual(identity(self.live), name)
            self.assertEqual((self.live / ".envrc").read_text(), "host-owned")
        self.assertTrue((self.live / "_playground/1-1/assets/chunk.js").is_file())
        operate(self.home, "rollback", "1-1")
        self.assertEqual(identity(self.live), "2-1")
        operate(self.home, "rollback", "2-1")
        self.assertEqual(identity(self.live), "1-1")
        operate(self.home, "rollback", "1-1")
        self.assertEqual((self.live / "index.html").read_text(), "original")

    def test_incomplete_or_unsafe_upload_keeps_current_site(self):
        self.archive("1-1")
        with self.assertRaises(ValueError):
            operate(self.home, "activate", "1-1", "0" * 64)
        digest = self.archive("2-1", [("../outside", "unexpected")])
        with self.assertRaises(ValueError):
            operate(self.home, "activate", "2-1", digest)
        self.assertEqual((self.live / "index.html").read_text(), "original")


if __name__ == "__main__":
    unittest.main()
