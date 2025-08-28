#!/bin/bash

set -e

AB_LIB_DIR="$HOME/.algo-bootstrap"
CPPLINT_LIB_DIR="$AB_LIB_DIR/deps/cpplint"

# Install cpplint
if command -v cpplint &> /dev/null; then
  echo "cpplint is already installed."
else
  echo "Installing cpplint..."
  # Check if the lib directory exists
  if [ ! -d "$AB_LIB_DIR" ]; then
    echo "Algo Bootstrap library directory not found: $AB_LIB_DIR"
    exit 1
  fi
  if [ ! -d "$CPPLINT_LIB_DIR" ]; then
    echo "cpplint library directory not found: $CPPLINT_LIB_DIR"
    exit 1
  fi

  mkdir -p $HOME/.local/bin

  chmod +x $AB_LIB_DIR/bin/cpplint.sh
  if [ -L "$HOME/.local/bin/cpplint" ]; then
    echo "cpplint symlink already exists, remove it and create new..."
    rm "$HOME/.local/bin/cpplint"
  fi
  ln -s $AB_LIB_DIR/bin/cpplint.sh $HOME/.local/bin/cpplint

  # Add ~/.local/bin to PATH
  bash $AB_LIB_DIR/tools/add-user-bin.sh

  echo "cpplint installed successfully."
fi
