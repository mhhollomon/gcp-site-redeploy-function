#
# configure bucket and service account
#
# The name for the bucket.
# Note:
#   Bucket names live in a global namespace across
#   all users of GCP. So, you will want to use a
#   bucket name that has a unique domain name or
#   the like - eg "mybucket.my-domain.tld"
#
BUCKET_NAME="<Your bucket name>"
#
# The Service Account associated with the Cloud Function.
# You can retrieve this with command:
#   gcloud functions describe redeploy --project ${PROJECT_ID} | grep serviceAccountEmail
#
FUNCTION_SA=$(gcloud functions describe redeploy --project ${PROJECT_ID} | grep serviceAccountEmail | cut -d' ' -f2)
#
# The (short) name for the service account
#
SA_NAME=github-action
#
# This will be the full name for the service account
#
SA_FULL=${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com


#
# Create the bucket
#
gsutil mb -p $PROJECT_ID -b on gs://${BUCKET_NAME}

#
# Create the service account that github will use to update the file
#   in the bucket.
#
gcloud iam service-accounts create ${SA_NAME} \
    --description "Account to be used by github actions" \
    --display-name "github-action" \
    --project $PROJECT_ID

#
# Create a key pair for the service account. GCP will keep the public
#   side. The file created will contain the private side that you will
#   attach to the github repo as a secret.
#   Note: Keep this file in a safe place. You can't get it again. Your only
#       option will be to create a new service account.
#
gcloud iam service-accounts keys create ~/${SA_NAME}_key.json \
    --iam-account ${SA_FULL}
    --project $PROJECT_ID

#
# Grant the new service account the permissions to create and update
#  files in the bucket.
#
gsutil iam ch serviceAccount:${SA_FULL}:roles/storage.objectAdmin gs://${BUCKET_NAME}

#
# Grant the same access to the Cloud Function's service account.
#
gsutil iam ch serviceAccount:${FUNCTION_SA}:roles/storage.objectAdmin \
    gs://${BUCKET_NAME}

#
# Add the full name of the service account as a secret to github as GCP_GITHUB_FID
#
echo "Add this as the value to a GitHub secret named GCP_GITHUB_FID"
echo ${SA_FULL}

#
# add the key as a secret to github as GCP_GITUB_KEY
#
echo "Add this as the value to a GitHub secret named GCP_GITHUB_KEY"
cat ~/${SA_NAME}_key.json | base64
