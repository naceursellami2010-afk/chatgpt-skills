import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
NON_SKILL_DIRS = {"tests", "public"}


def list_candidate_skills():
    """Return top-level directories that should contain a SKILL.md."""
    return [
        d
        for d in ROOT.iterdir()
        if d.is_dir() and not d.name.startswith(".") and d.name not in NON_SKILL_DIRS
    ]


def parse_frontmatter(skill_md: Path):
    """Extract a minimal key/value mapping from SKILL.md frontmatter."""
    content = skill_md.read_text(encoding="utf-8")
    if not content.startswith("---"):
        raise AssertionError(f"{skill_md} missing starting frontmatter fence '---'")

    parts = content.split("---", 2)
    if len(parts) < 3:
        raise AssertionError(f"{skill_md} frontmatter not closed with '---'")

    frontmatter_block = parts[1]
    mapping = {}
    for line in frontmatter_block.splitlines():
        if ":" not in line:
            continue
        key, value = line.split(":", 1)
        mapping[key.strip()] = value.strip()
    return mapping


def catalog_entries(doc: Path):
    """Return skill names listed as `- `name`` bullets in a doc's catalog section."""
    content = doc.read_text(encoding="utf-8")
    if "<!-- SKILL-LIST:START -->" in content:
        content = content.split("<!-- SKILL-LIST:START -->", 1)[1].split("<!-- SKILL-LIST:END -->", 1)[0]
    else:
        content = content.split("## Catalog", 1)[1].split("\n## ", 1)[0]
    return set(re.findall(r"^- `([a-z0-9-]+)`\s*$", content, re.MULTILINE))


class SkillStructureTests(unittest.TestCase):
    def test_all_skill_dirs_have_skill_md(self):
        missing = [d.name for d in list_candidate_skills() if not (d / "SKILL.md").exists()]
        self.assertFalse(missing, f"Missing SKILL.md in: {', '.join(sorted(missing))}")

    def test_frontmatter_name_and_description(self):
        errors = []
        for skill_dir in list_candidate_skills():
            skill_md = skill_dir / "SKILL.md"
            if not skill_md.exists():
                continue  # Covered by previous test; avoid duplicate noise

            try:
                fm = parse_frontmatter(skill_md)
            except AssertionError as exc:
                errors.append(str(exc))
                continue

            name = fm.get("name")
            description = fm.get("description")

            if not name:
                errors.append(f"{skill_md} missing 'name' in frontmatter")
            elif not re.fullmatch(r"[a-z0-9-]+", name):
                errors.append(f"{skill_md} has invalid name '{name}' (use hyphen-case)")
            elif name not in {skill_dir.name} and name not in skill_dir.name:
                errors.append(f"{skill_md} name '{name}' should align with folder '{skill_dir.name}'")

            if not description:
                errors.append(f"{skill_md} missing 'description' in frontmatter")

        self.assertFalse(errors, "Frontmatter issues:\n- " + "\n- ".join(errors))

    def test_skill_dirs_have_openai_yaml(self):
        missing = [
            d.name for d in list_candidate_skills() if not (d / "agents" / "openai.yaml").exists()
        ]
        self.assertFalse(missing, f"Missing agents/openai.yaml in: {', '.join(sorted(missing))}")

    def test_catalogs_match_skill_dirs(self):
        skills = {d.name for d in list_candidate_skills()}
        for doc in ("README.md", "CLAUDE.md"):
            listed = catalog_entries(ROOT / doc)
            self.assertEqual(
                listed,
                skills,
                f"{doc} catalog out of sync: missing {sorted(skills - listed)}, "
                f"extra {sorted(listed - skills)}",
            )

    def test_repository_docs_exist(self):
        for doc in ("README.md", "CLAUDE.md"):
            path = ROOT / doc
            self.assertTrue(path.exists(), f"Expected repository doc missing: {doc}")
            self.assertGreater(
                path.stat().st_size, 0, f"Repository doc is empty: {doc}"
            )


if __name__ == "__main__":
    unittest.main()
