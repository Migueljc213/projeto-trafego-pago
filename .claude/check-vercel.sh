#!/usr/bin/env bash
# Checks the latest Vercel deployment for the project.
# Outputs JSON with: status, url, buildLogs (if failed)
# Requires: VERCEL_TOKEN and VERCEL_PROJECT_ID in .env.local

set -euo pipefail

ENV_FILE="$(dirname "$0")/../.env.local"
if [[ -f "$ENV_FILE" ]]; then
  export $(grep -E '^(VERCEL_TOKEN|VERCEL_PROJECT_ID|VERCEL_TEAM_ID)=' "$ENV_FILE" | xargs)
fi

if [[ -z "${VERCEL_TOKEN:-}" ]]; then
  echo '{"error": "VERCEL_TOKEN not set in .env.local"}'
  exit 1
fi

if [[ -z "${VERCEL_PROJECT_ID:-}" ]]; then
  echo '{"error": "VERCEL_PROJECT_ID not set in .env.local"}'
  exit 1
fi

TEAM_PARAM=""
if [[ -n "${VERCEL_TEAM_ID:-}" ]]; then
  TEAM_PARAM="&teamId=${VERCEL_TEAM_ID}"
fi

# Get latest deployment
DEPLOY=$(curl -sf \
  "https://api.vercel.com/v6/deployments?projectId=${VERCEL_PROJECT_ID}&limit=1${TEAM_PARAM}" \
  -H "Authorization: Bearer ${VERCEL_TOKEN}" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); deps=d.get('deployments',[]); print(json.dumps(deps[0] if deps else {}))")

if [[ "$DEPLOY" == "{}" ]]; then
  echo '{"status": "no_deployments"}'
  exit 0
fi

DEPLOY_ID=$(echo "$DEPLOY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('uid',''))")
DEPLOY_STATE=$(echo "$DEPLOY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('state',''))")
DEPLOY_URL=$(echo "$DEPLOY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('url',''))")
DEPLOY_CREATED=$(echo "$DEPLOY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('createdAt',''))")

if [[ "$DEPLOY_STATE" == "ERROR" || "$DEPLOY_STATE" == "CANCELED" ]]; then
  # Fetch build logs
  LOGS=$(curl -sf \
    "https://api.vercel.com/v2/deployments/${DEPLOY_ID}/events?builds=1&limit=100${TEAM_PARAM}" \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" | \
    python3 -c "
import sys, json
events = json.load(sys.stdin)
lines = []
for e in events:
    if isinstance(e, dict):
        payload = e.get('payload', e)
        text = payload.get('text', '') if isinstance(payload, dict) else ''
        if text:
            lines.append(text)
print('\n'.join(lines[-200:]))
" 2>/dev/null || echo "could not fetch logs")

  python3 -c "
import json, sys
print(json.dumps({
  'status': 'error',
  'deployId': '$DEPLOY_ID',
  'url': '$DEPLOY_URL',
  'createdAt': '$DEPLOY_CREATED',
  'buildLogs': sys.argv[1]
}))" "$LOGS"
else
  python3 -c "
import json
print(json.dumps({
  'status': '$DEPLOY_STATE',
  'deployId': '$DEPLOY_ID',
  'url': '$DEPLOY_URL',
  'createdAt': '$DEPLOY_CREATED'
}))"
fi
