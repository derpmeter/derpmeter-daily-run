#!/bin/sh
# Install (or reinstall) the daily Lab run as a launchd agent for this user.
#   sh bin/install.sh            install (runs daily at 03:30 local time)
#   sh bin/install.sh --remove   stop and remove
# Uses the Claude Code, Codex and Antigravity logins already on this Mac.
set -eu
label=com.derpmeter.lab-daily
target="$HOME/Library/LaunchAgents/$label.plist"
if [ "${1:-}" = "--remove" ]; then
  launchctl bootout "gui/$(id -u)/$label" 2>/dev/null || true
  rm -f "$target"
  echo "Removed $label."
  exit 0
fi
repo=$(cd "$(dirname "$0")/.." && pwd)
node=$(command -v node)
claude=$(command -v claude)
codex=$(command -v codex)
agy=$(command -v agy)
python=$(command -v python3)
# Python first: the pymd fixture needs Python 3.11+ (macOS /usr/bin has 3.9).
bindirs="$(dirname "$python"):$(dirname "$claude"):$(dirname "$codex"):$(dirname "$agy")"
log="$HOME/Library/Logs/derpmeter-lab-daily.log"
[ -f "$repo/.env" ] || { echo "Missing $repo/.env (see .env.example)."; exit 1; }
sed -e "s|__REPO__|$repo|" -e "s|__NODE__|$node|" -e "s|__NODEDIR__|$(dirname "$node")|" \
  -e "s|__BINDIRS__|$bindirs|" -e "s|__CLAUDE__|$claude|" -e "s|__CODEX__|$codex|" \
  -e "s|__AGY__|$agy|" -e "s|__LOG__|$log|g" "$repo/launchd/$label.plist" > "$target"
plutil -lint "$target" >/dev/null
launchctl bootout "gui/$(id -u)/$label" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$target"
echo "Installed $label (daily 03:30). Log: $log"
