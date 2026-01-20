#!/bin/bash

set -e

readonly thisDir=$(cd $(dirname $0); pwd)
cd $(dirname $0)/../..
DIST="$(pwd)/dist"
./scripts/ci/build-yelon.sh
