#!/usr/bin/env -S bash -x

TOPIC="redeploy-trigger"

func_name=redeploy

if  [ "$1" = "test" ]; then
    shift
    func_name="redeploy_test"
fi

if [ "$1" = "function" ]; then
    shift
    VARIABLES="GITHUB_AUTH_KEY=${GITHUB_AUTH_KEY}"
    if [ "${EMAIL_API_KEY:-xxNONExx}" != "xxNONExx" ]; then
        VARIABLES+=",EMAIL_API_KEY=${EMAIL_API_KEY}"
    fi
    (
        cd src
        gcloud functions deploy ${func_name} --runtime nodejs10 \
            --allow-unauthenticated \
            --trigger-topic ${TOPIC} \
            --project ${PROJECT_ID} \
            --set-env-vars ${VARIABLES}
    )
fi

if [ "$1" = "trigger" ]; then
	gcloud scheduler jobs create pubsub redeploy-trigger  \
		--project ${PROJECT_ID} \
		--time-zone="America/New_York" --topic=${TOPIC} --schedule="10 5 * * *" \
		--message-body="{}" --description="trigger the redeploy function"
fi
 
