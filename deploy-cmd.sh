#!/usr/bin/env -S bash -x

pubsub_topic="redeploy-trigger"

func_name=redeploy

if  [ "$1" = "test" ]; then
    shift
    func_name="redeploy_test"
    pubsub_topic="redeploy-test-trigger"
fi

if [ "$1" = "function" ]; then
    shift

    gcloud functions deploy ${func_name} \
        --source src \
        --docker-registry=artifact-registry \
        --runtime nodejs18 \
        --trigger-topic ${pubsub_topic} \
        --project ${PROJECT_ID}
fi

if [ "$1" = "trigger" ]; then
	gcloud scheduler jobs create pubsub ${pubsub_topic}  \
		--project ${PROJECT_ID} \
		--time-zone="America/New_York" --topic=${pubsub_topic} --schedule="10 5 * * *" \
		--message-body="{}" --description="trigger the redeploy test function"
fi
 
