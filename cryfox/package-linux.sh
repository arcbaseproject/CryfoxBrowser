#!/bin/sh
# Package an existing CryFox Linux build as a tarball, .deb and .rpm in
# dist-cryfox/. Run ./mach build first.
#
# Needs rpm-build and podman. The .deb is made in a Debian container because
# dpkg-shlibdeps needs a Debian system to work out the package dependencies.

set -eu

cd "$(git rev-parse --show-toplevel)"

version=$(cat browser/config/version_display.txt)
arch=$(uname -m)
out=dist-cryfox
mkdir -p "$out"

./mach package
objdir=$(./mach environment --format json | python3 -c 'import json, sys; print(json.load(sys.stdin)["topobjdir"])')
tarball=$(ls "$objdir"/dist/cryfox-"$version".*.linux-"$arch".tar.*)
cp "$tarball" "$out/cryfox-$version-linux-$arch.tar.xz"

xpi_dir=$(mktemp -d)
UPLOAD_DIR="$xpi_dir" ./mach repackage rpm --input "$tarball" --input-xpi-dir "$xpi_dir" \
  --output "$out" --arch "$arch" --version "$version" --build-number 1 \
  --templates browser/installer/linux/app/rpm --product firefox \
  --release-type release
rm -r "$xpi_dir"

podman run --rm --security-opt label=disable -v "$PWD:$PWD" -w "$PWD" \
  docker.io/library/debian:bookworm sh -c "
  apt-get update &&
  apt-get install -y --no-install-recommends python3 python3-venv git \
    ca-certificates build-essential dpkg-dev debhelper libasound2 libgtk-3-0 libx11-xcb1 \
    libxtst6 &&
  ./mach repackage deb --input '$tarball' \
    --output '$out/cryfox-$version-linux-$arch.deb' --arch '$arch' \
    --version '$version' --build-number 1 \
    --templates browser/installer/linux/app/debian --product firefox \
    --release-type release"

ls -l "$out"
