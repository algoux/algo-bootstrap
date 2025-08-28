#!/bin/bash

set -e

AB_LIB_DIR="$HOME/.algo-bootstrap"
CPPCHECK_LIB_DIR="$AB_LIB_DIR/deps/cppcheck"

# Install cppcheck
if command -v cppcheck &> /dev/null; then
  echo "cppcheck is already installed."
else
  echo "Installing cppcheck..."
  # Check if the lib directory exists
  if [ ! -d "$AB_LIB_DIR" ]; then
    echo "Algo Bootstrap library directory not found: $AB_LIB_DIR"
    exit 1
  fi
  if [ ! -d "$CPPCHECK_LIB_DIR" ]; then
    echo "cppcheck library directory not found: $CPPCHECK_LIB_DIR"
    exit 1
  fi

  mkdir -p $HOME/.local/bin

  cd $CPPCHECK_LIB_DIR && make MATCHCOMPILER=yes FILESDIR=$CPPCHECK_LIB_DIR CXXFLAGS="-O2 -DNDEBUG -Wall -Wno-sign-compare -Wno-unused-function" -j4
  cd $CPPCHECK_LIB_DIR && make install FILESDIR=$CPPCHECK_LIB_DIR PREFIX=$HOME/.local

  # Add ~/.local/bin to PATH
  bash $AB_LIB_DIR/tools/add-user-bin.sh

  echo "cppcheck installed successfully."
fi
