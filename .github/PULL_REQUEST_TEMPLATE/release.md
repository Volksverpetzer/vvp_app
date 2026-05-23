## Release <!-- version e.g. 2.1.13 -->

**Type:** <!-- [ ] Beta &nbsp;&nbsp; [ ] Production -->

---

### Pre-merge checklist

**Version**

- [ ] `version` bumped in `package.json` (e.g. `2.1.13`)
- [ ] `versionCode` bumped in `package.json` — any integer strictly greater than the previous one (date-based is recommended, e.g. `2026052301`)

**Changelog**

- [ ] `fastlane/metadata/android/de-DE/changelogs/{versionCode}.txt` created with German release notes
- [ ] `pnpm changelog:sync` run — generates `src/constants/Changelog.ts` and copies to `en-US`
- [ ] All three files committed: `de-DE/{versionCode}.txt`, `en-US/{versionCode}.txt`, `Changelog.ts`

**Quality**

- [ ] `pnpm lint:fix` — no errors
- [ ] `pnpm check` — types + spelling clean
- [ ] `pnpm test` — all tests pass

**Target branch**

- [ ] Beta → merge into `prerelease`
- [ ] Production → merge into `main`

---

### Post-merge: trigger the release

**Beta**

```
git tag {version}-beta.1
git push origin {version}-beta.1
```

CI workflow: `expo-release-beta.yml` · Store track: internal

**Production**

```
git tag v{version}
git push origin v{version}
```

CI workflow: `expo-release.yml` · Store track: beta → promote manually

---

### Post-release checklist

- [ ] CI passed: test-and-lint → build-and-release-stores → build-and-release-apk
- [ ] EAS dashboard: both Android + iOS builds submitted successfully
- [ ] GitHub Release created with APK + FOSS APK attached
- [ ] **F-Droid** (`fdroiddata` repo, separate PR):
  - [ ] New entry under `Builds:` with matching `versionName` + `versionCode`
  - [ ] `CurrentVersion` and `CurrentVersionCode` updated at the bottom
