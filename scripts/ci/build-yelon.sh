#!/usr/bin/env bash

set -u -e -o pipefail
cd $(dirname $0)/../..
source ./scripts/ci/utils.sh

PACKAGES=(
  connector
)

NOCSS=false


for ARG in "$@"; do
  case "$ARG" in
    -n)
      PACKAGES=($2)
      ;;
    -debug)
      DEBUG=true
      ;;
    -nocss)
      NOCSS=true
      ;;
  esac
done

buildLess() {
  echo 'copy styles...'
  node ./scripts/build/copy-less.js
}

PWD=`pwd`
SOURCE=${PWD}/packages
DIST=${PWD}/dist/@yelon/connector


build() {
  for NAME in ${PACKAGES[@]}
  do
    echo "====== PACKAGING ${NAME}"
    if ! containsElement "${NAME}" "${NODE_PACKAGES[@]}"; then
      node --max_old_space_size=4096 ${PWD}/scripts/build/packing ${NAME}
    else
      echo "not yet!!!"
    fi
  done
  if [[ ${NOCSS} == false ]]; then
    buildLess
  fi
  updateVersionReferences ${DIST}
}

build

echo 'FINISHED!'
