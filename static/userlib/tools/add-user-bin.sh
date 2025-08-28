#!/bin/bash

get_default_shell() {
  if [ "$(uname)" = "Darwin" ]; then
    shell=$(dscl . -read "/Users/$(whoami)" UserShell 2>/dev/null | awk '{print $2}')
  fi

  if [ -z "$shell" ]; then
    shell=$(awk -F: -v user="$(whoami)" '$1 == user {print $7}' /etc/passwd 2>/dev/null)
  fi

  if [ -z "$shell" ]; then
    shell="$SHELL"
  fi

  basename "${shell}"
}

get_shell_config_file() {
  case "$1" in
    bash)
      echo "${HOME}/.bashrc"
      ;;
    zsh)
      echo "${HOME}/.zshrc"
      ;;
    fish)
      echo "${HOME}/.config/fish/config.fish"
      ;;
    *)
      # use ~/.profile (sh/dash etc)
      echo "${HOME}/.profile"
      ;;
  esac
}

get_path_config() {
  case "$1" in
    fish)
      echo 'set -gx PATH "$HOME/.local/bin" $PATH'
      ;;
    *)
      echo 'export PATH="$HOME/.local/bin:$PATH"'
      ;;
  esac
}

main() {
  local default_shell config_file path_config

  default_shell=$(get_default_shell)
  echo "Detected default shell: ${default_shell}"

  config_file=$(get_shell_config_file "${default_shell}")
  echo "Detected default shell config file: ${config_file}"

  mkdir -p "$(dirname "${config_file}")"
  touch "${config_file}"

  path_config=$(get_path_config "${default_shell}")

  if grep -q "\.local/bin" "${config_file}"; then
    echo "\"~/.local/bin\" is existed in ${config_file}, no need to append."
    return 0
  fi

  echo "Append \"${path_config}\" to config file"
  echo -e "\n${path_config}" >> "${config_file}"

  echo "Run the following command to make the changes take effect:"
  echo "  source ${config_file}"
}

main
