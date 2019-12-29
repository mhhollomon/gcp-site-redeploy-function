#!/usr/bin/env bash


MSG=$(cat <<_EOM_
{
  "message": {
    "attributes": {
      "key": "value"
    },
    "data": "GCP Functions",
    "messageId": "136969346945"
  },
  "subscription": "projects/myproject/subscriptions/mysubscription"
}
_EOM_
)

curl -d "${MSG}" -X POST \
    -H "Ce-Type: true" \
    -H "Ce-Specversion: true" \
    -H "Ce-Source: true" \
    -H "Ce-Id: true" \
    -H "Content-Type: application/json" \
    http://localhost:8080
