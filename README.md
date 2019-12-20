# gcp-site-redeploy-function

System to redeploy a hugo web site when a future dated post is ready.

Currently works with Firebase hosting but will work with netlify as well in the
future.

## Rough flow

![Flow Diagram](/docs/flow.png)

1. User pushes content to master branch
2. Github action fires doing two things:
    1. Build the site and deploy.
    2. Update a timestamp in a Google Cloud Storage bucket

_time passes_

1. A GCP Scheduler job publish to topic
2. A Cloud Function activates on that topic and
    1. Reads the timestamp from the bucket
    2. If the current date is AFTER the timestamp
        - call back into github to start the actions
    3. Send email about what it did.

## Installing

Lots more documentation to come ...

- Edit `redeploy.json.example` and copy to `redeploy.json`

- Set the following environment variables in your crrent shell
    - GITHUB_AUTH_KEY : A personal access token
    - EMAIL_API_KEY   : The SendGrid API key
    - PROJECT_ID      : The name of your GCP Project

- run `deploy-cmd.sh function` to create the function
- run `deploy-cmd.sh trigger` to create the Scheduler Job
- edit the BUCKET_NAME line in `service_account.sh`
- run the edited `service_account.sh`
- add the github secrets as instructed by the script
- Edit BUCKET_URI in `schedule-redeploy.yml` and copy the workflows to your
  respository.
