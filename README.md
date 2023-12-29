# Serverless Slack Demo

This is a small demo that uses an [API Gateway WebSocket API](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html), several Lambda functions, and a DynamoDB table to create an app that behaves like Slack.

I built this because a lot of the API Gateway WebSocket API documentation only covers simple cases like direct two-way communication, or broadcast messaging. I wanted to build something that was a little more realistic. This demo covers some more advanced communication flows like a Pub/Sub pattern, where message notifications are only sent to the users that are subscribed to a channel.

This demo also uses the "Single-Table Design" pattern for DynamoDB, which is a pattern that I've found to be very useful for building serverless applications. You can read more about that here: [Single-Table Design with DynamoDB](https://www.alexdebrie.com/posts/dynamodb-single-table/). Trying to model the data access patterns needed for a Slack clone using a single DynamoDB table turned out to be a really fun exercise.

## Components

### `packages/test-conneect`

This is a Lambda handler that handles `$connect` and `$disconnect` events for the WebSocket API. It does very rudimentary authentication (users send their user ID in a header or query string). It creates several records in DynamoDB to track the user's connection status and the channels they are subscribed to.

### `packages/test-default`

This Lambda handler handles every other message that the WebSocket API receives. Each message indicates a certain action by sending a payload like `{"event": "actionName"}` and the handler uses that to determine which function to call.

### `packages/chat-bot`

A Node.js WebSocket client that spams a channel with a bunch of messages. Can be used to generate sample traffic or to do simple load testing.

### `packages/app`

A Next.js app that serves as a frontend for the demo and looks a lot like Slack. It has no persistent auth; you pick a user when the page loads and everything you do until you refresh the page is done as that user.
