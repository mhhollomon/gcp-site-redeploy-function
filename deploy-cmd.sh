TOPIC="netlify-deploy"

gcloud functions deploy redeploy --runtime nodejs10 \
    --trigger-topic ${TOPIC} \
    --project ${PROJECT_ID} \
    --set-env-vars EMAIL_API_KEY=${EMAIL_API_KEY}

if [ "$1" = "trigger" ]; then
	gcloud scheduler jobs create pubsub netlify-redeploy  \
		--project ${PROJECT_ID} \
		--timezone="America/New_York" --topic=${TOPIC} --schedule="10 5 * * *" \
		--message-body="{}" --description="trigger the redeploy function"
fi
 
