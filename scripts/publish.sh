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


export AWS_PAGER=""
# Create rooms
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#general"}, "sk": {"S": "ROOM"}}'
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#quotes"}, "sk": {"S": "ROOM"}}'
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#random"}, "sk": {"S": "ROOM"}}'

# Add users to rooms
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#general"}, "sk": {"S": "USER#RfapeOt24VhjfJwuzKjur"}}'
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#quotes"}, "sk": {"S": "USER#RfapeOt24VhjfJwuzKjur"}}'
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#random"}, "sk": {"S": "USER#RfapeOt24VhjfJwuzKjur"}}'

aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#general"}, "sk": {"S": "USER#zwn17MznDSVvJD4Z-KnNF"}}'
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#quotes"}, "sk": {"S": "USER#zwn17MznDSVvJD4Z-KnNF"}}'
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#random"}, "sk": {"S": "USER#zwn17MznDSVvJD4Z-KnNF"}}'

aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#general"}, "sk": {"S": "USER#jP3WGdnq9bJydLlY3BPxI"}}'
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#quotes"}, "sk": {"S": "USER#jP3WGdnq9bJydLlY3BPxI"}}'
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#random"}, "sk": {"S": "USER#jP3WGdnq9bJydLlY3BPxI"}}'

aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#general"}, "sk": {"S": "USER#DN37h9ZP9EnBvI0XNW-mi"}}'
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#quotes"}, "sk": {"S": "USER#DN37h9ZP9EnBvI0XNW-mi"}}'
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#random"}, "sk": {"S": "USER#DN37h9ZP9EnBvI0XNW-mi"}}'

aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#general"}, "sk": {"S": "USER#BreNl8bKwvgzvajnnO8xj"}}'
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#quotes"}, "sk": {"S": "USER#BreNl8bKwvgzvajnnO8xj"}}'
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#random"}, "sk": {"S": "USER#BreNl8bKwvgzvajnnO8xj"}}'

# Create a DM channel for Alice and Bob
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#RfapeOt24VhjfJwuzKjur#zwn17MznDSVvJD4Z-KnNF"}, "sk": {"S": "ROOM"}}'
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#RfapeOt24VhjfJwuzKjur#zwn17MznDSVvJD4Z-KnNF"}, "sk": {"S": "USER#RfapeOt24VhjfJwuzKjur"}}'
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#RfapeOt24VhjfJwuzKjur#zwn17MznDSVvJD4Z-KnNF"}, "sk": {"S": "USER#zwn17MznDSVvJD4Z-KnNF"}}'

# Create a DM channel for Alice and Trudy
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#RfapeOt24VhjfJwuzKjur#jP3WGdnq9bJydLlY3BPxI"}, "sk": {"S": "ROOM"}}'
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#RfapeOt24VhjfJwuzKjur#jP3WGdnq9bJydLlY3BPxI"}, "sk": {"S": "USER#RfapeOt24VhjfJwuzKjur"}}'
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#RfapeOt24VhjfJwuzKjur#jP3WGdnq9bJydLlY3BPxI"}, "sk": {"S": "USER#jP3WGdnq9bJydLlY3BPxI"}}'

# Create a DM channel for Alice and Carlos
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#DN37h9ZP9EnBvI0XNW-mi#RfapeOt24VhjfJwuzKjur"}, "sk": {"S": "ROOM"}}'
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#DN37h9ZP9EnBvI0XNW-mi#RfapeOt24VhjfJwuzKjur"}, "sk": {"S": "USER#DN37h9ZP9EnBvI0XNW-mi"}}'
aws dynamodb put-item \
  --table-name serverless-slack-clone \
  --item '{"pk": {"S": "ROOM#DN37h9ZP9EnBvI0XNW-mi#RfapeOt24VhjfJwuzKjur"}, "sk": {"S": "USER#RfapeOt24VhjfJwuzKjur"}}'
