#!/bin/sh
# Move the CryFox commits onto a newer Firefox release.
#
# Usage: cryfox/update-firefox.sh [FIREFOX_<version>_RELEASE]
# Without an argument, the newest Firefox release tag is used.
#
# CryFox is a stack of commits whose subjects start with "CryFox:" on top of
# one commit holding the source of a Firefox release. Every CryFox commit must
# keep that prefix, because the first commit without it is taken as the
# current Firefox base. The base has no parent so the repository can be pushed
# without Firefox's full history.

set -eu

UPSTREAM_URL=https://github.com/mozilla-firefox/firefox

cd "$(git rev-parse --show-toplevel)"

if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "Commit or stash your changes first." >&2
  exit 1
fi

git remote get-url upstream >/dev/null 2>&1 || git remote add upstream "$UPSTREAM_URL"

new_tag=${1:-$(git ls-remote --tags --refs upstream 'FIREFOX_*_RELEASE' |
  sed -n 's|.*refs/tags/\(FIREFOX_[0-9][0-9_]*_RELEASE\)$|\1|p' |
  sort -t_ -k2,2n -k3,3n -k4,4n -k5,5n | tail -n 1)}

old_base=$(git log --format='%H %s' | awk '$2 != "CryFox:" { print $1; exit }')
branch=$(git branch --show-current)

echo "Fetching $new_tag..."
git fetch --depth=1 upstream tag "$new_tag"

if [ "$(git rev-parse "$new_tag^{tree}")" = "$(git rev-parse "$old_base^{tree}")" ]; then
  echo "Already on $new_tag."
  exit 0
fi

version=$(git show "$new_tag:browser/config/version.txt")
new_base=$(git commit-tree "$new_tag^{tree}" -m "Firefox $version source ($new_tag)")

backup="$branch-before-$new_tag"
git branch -f "$backup"
echo "Saved the current state as branch $backup."

if git rebase --onto "$new_base" "$old_base" "$branch"; then
  echo "Done: $branch is now based on $new_tag. Run ./mach build to rebuild."
  exit 0
fi

cat >&2 <<EOF

Some CryFox changes conflict with $new_tag. To finish:
  1. Fix the files 'git status' lists as conflicted, then 'git add' them.
     For a Kit mascot image, take the new upstream file and recolor it:
       git checkout $new_tag -- FILE && python3 cryfox/recolor-kit.py FILE
     If upstream deleted the file, run 'git rm FILE'.
  2. Run 'git rebase --continue' and repeat until it finishes.
To give up and go back: git rebase --abort (your branch is also saved as $backup).
EOF
exit 1
