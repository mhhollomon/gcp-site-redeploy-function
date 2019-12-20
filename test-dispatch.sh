#!/usr/bin/bash -xv


GITHUB_USER_REPO="<your repo with username jdoe/my_repo>"

MSG=$(cat <<_EOM_
{
    "event_type" : "request-redeploy"
}
_EOM_
)

curl -d "${MSG}" -X POST \
    -H "Authorization: token ${GITHUB_AUTH_KEY}" \
    -H "Accept: application/vnd.github.everest-preview+json" \
    -H "Content-Type: application/json" \
    https://api.github.com/repos/${GITHUB_USER_REPO}/dispatches
