#!/bin/bash

set -ueo pipefail

aws cloudformation deploy \
  --stack-name serverless-slack-clone-assets \
  --template-file cloudformation/assets.yaml \
  --tags "project=serverless-slack-clone"

npm -w packages/test-connect run build && npm -w packages/test-connect run upload
npm -w packages/test-default run build && npm -w packages/test-default run upload

aws cloudformation deploy \
  --stack-name serverless-slack-clone \
  --template-file cloudformation/template.yaml \
  --tags "project=serverless-slack-clone" \
  --capabilities CAPABILITY_NAMED_IAM

# update function code if LAMBDA_FORCE_UPDATE is not empty
if [ -n "${LAMBDA_FORCE_UPDATE:-}" ]; then
  AWS_PAGER="" npm -w packages/test-connect run lambda:update
  AWS_PAGER="" npm -w packages/test-default run lambda:update
fi
