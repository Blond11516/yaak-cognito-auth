# Yaak Cognito Plugin

A [Yaak](https://yaak.app) plugin that provides functions to ease authentication with [AWS Cognito](https://aws.amazon.com/cognito/).

## Available functions

- `cognitoUserPassword`: Uses the username-password flow to authenticate with Cognito User Pools. Returns the access JWT.

## Planned features

- [] Store and use refresh token instead of requesting a brand new session when the access token is expired (username/password)
- [] Store and use refresh token instead of requesting a brand new session when the access token is expired (federated idp)
- [] Store token outside of the JS module to allow reusing a token after Yaak is relaunched. (username/password)
- [] Store token outside of the JS module to allow reusing a token after Yaak is relaunched. (federated idp)
