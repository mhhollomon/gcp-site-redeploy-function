#!/usr/bin/env -S bash -x

TOPIC="redeploy-trigger"

func_name=redeploy

if  [ "$1" = "test" ]; then
    shift
    func_name="redeploy_test"
    TOPIC="redeploy-test-trgger"
fi

if [ "$1" = "function" ]; then
    shift

    gcloud functions deploy ${func_name} \
        --source src
        --runtime nodejs10 \
        --trigger-topic ${TOPIC} \
        --project ${PROJECT_ID}
fi

if [ "$1" = "trigger" ]; then
	gcloud scheduler jobs create pubsub redeploy-trigger  \
		--project ${PROJECT_ID} \
		--time-zone="America/New_York" --topic=${TOPIC} --schedule="10 5 * * *" \
		--message-body="{}" --description="trigger the redeploy function"
fi
 
