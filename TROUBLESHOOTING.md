# Troubleshooting superomni Installation

## Issue: `npx superomni` completes but creates no files

### Symptoms
- Running `npx github:Wilder1222/superomni` returns to prompt
- No `.superomni/`, `CLAUDE.md`, `AGENTS.md` or other config files created
- No error messages displayed

### Cause
- Outdated npm cache with previous version of setup.js

### Solution

**① Use npm cache clear:**
```bash
npx --no-cache github:Wilder1222/superomni
```

**② Or manually clear npm cache:**
```bash
npm cache clean --force
npx github:Wilder1222/superomni
```

**③ Verify installation:**
After running npx, check for these files:
```bash
ls -la .superomni/
ls -la CLAUDE.md        # or AGENTS.md, GEMINI.md
```

---

## Debugging

### Enable debug output
```bash
DEBUG_SUPEROMNI_INSTALL=1 npx github:Wilder1222/superomni
```

### Check postinstall logs
After failed installation, Check diagnostic logs:
```bash
ls ~/.omni-skills/logs/postinstall-*.log
cat ~/.omni-skills/logs/postinstall-*.log
```

---

## Performance Notes

- **Project-level install** (`npx superomni`): 5-15 seconds
- **Global install** (`npm install -g`): 10-20 seconds
- Most time spent on:
  1. Downloading package
  2. Building skill documentation from templates
  3. Copying files to destination

---

## Questions?

If issues persist:
1. Clear npm cache: `npm cache clean --force`
2. Update npm: `npm install -g npm@latest`
3. Try again: `npx --no-cache github:Wilder1222/superomni`
