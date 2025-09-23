set -e

APP_PATH=$(find release -name "*.app" -type d 2>/dev/null | head -1)

if [ -n "$APP_PATH" ]; then
  echo "Running code signing for $APP_PATH"
  codesign --force --deep --sign - "$APP_PATH"
  codesign -dv "$APP_PATH"
else
  echo "No app path found"
  exit 1
fi
