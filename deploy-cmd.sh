#!/usr/bin/bash -x

TOPIC="redeploy-trigger"

if [ "$1" = "function" ]; then
    shift
    VARIABLES="GITHUB_AUTH_KEY=${GITHUB_AUTH_KEY}"
    if [ "${EMAIL_API_KEY:-xxNONExx}" != "xxNONExx" ]; then
        VARIABLES+=",EMAIL_API_KEY=${EMAIL_API_KEY}"
    fi
    gcloud functions deploy redeploy --runtime nodejs10 \
        --trigger-topic ${TOPIC} \
        --project ${PROJECT_ID} \
        --set-env-vars ${VARIABLES}
fi

if [ "$1" = "trigger" ]; then
	gcloud scheduler jobs create pubsub redeploy-trigger  \
		--project ${PROJECT_ID} \
		--time-zone="America/New_York" --topic=${TOPIC} --schedule="10 5 * * *" \
		--message-body="{}" --description="trigger the redeploy function"
fi
 
