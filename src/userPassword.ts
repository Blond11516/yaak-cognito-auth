import { createHmac } from "node:crypto";
import { type InvalidTokenError, jwtDecode } from "jwt-decode";
import * as s from "superstruct";

export enum TokenType {
  Access = "access",
  Id = "id",
}

type TokenRequestBody = {
  AuthFlow: "USER_PASSWORD_AUTH";
  ClientId: string;
  AuthParameters: {
    USERNAME: string;
    PASSWORD: string;
    SECRET_HASH?: string;
  };
};

const ResponseStruct = s.object({
  AuthenticationResult: s.object({
    AccessToken: s.string(),
    ExpiresIn: s.number(),
    IdToken: s.string(),
    RefreshToken: s.string(),
    TokenType: s.string(),
  }),
  ChallengeParameters: s.object({}),
});

// Get JWT Token from Cognito
async function session(
  username: string,
  password: string,
  region: string,
  clientId: string,
  tokenType: TokenType,
  clientSecret: string | undefined
): Promise<string> {
  const domain = region.split("_")[0]; // backward compatible with Pool

  const requestBody: TokenRequestBody = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: clientId,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  };

  if (clientSecret) {
    const hash = secretHash(clientSecret, username, clientId);
    requestBody.AuthParameters.SECRET_HASH = hash;
  }

  const response = await fetch(`https://cognito-idp.${domain}.amazonaws.com`, {
    method: "post",
    headers: {
      "content-type": "application/x-amz-json-1.1",
      "x-amz-target": "AWSCognitoIdentityProviderService.InitiateAuth",
    },
    body: JSON.stringify(requestBody),
  });

  if (response.status !== 200) {
    requestBody.AuthParameters.PASSWORD = "__redacted__";
    return `Error in getting session: ${JSON.stringify({
      requestBody: requestBody,
      responseStatus: response.status,
      responseBody: response.body,
    })}`;
  }

  const { AuthenticationResult } = s.mask(
    await response.json(),
    ResponseStruct
  );
  return tokenType === TokenType.Id
    ? AuthenticationResult.IdToken
    : AuthenticationResult.AccessToken;
}

function secretHash(
  ClientSecret: string,
  Username: string,
  ClientId: string
): string {
  return createHmac("sha256", ClientSecret)
    .update(Username + ClientId)
    .digest("base64")
    .toString();
}

function validToken(token: string): boolean {
  const now = Date.now().valueOf() / 1000;
  try {
    const data = jwtDecode(token);
    if (data.exp !== undefined && data.exp < now) {
      return false;
    }
    if (data.nbf !== undefined && data.nbf > now) {
      return false;
    }
    return true;
  } catch (_) {
    return false;
  }
}

let token: string | null = null;

async function getUserPasswordAccessToken(
  Username: string,
  Password: string,
  Region: string,
  ClientId: string,
  TokenType: TokenType,
  ClientSecret: string | undefined
): Promise<string> {
  if (token && validToken(token)) {
    try {
      jwtDecode(token);
      return token;
    } catch (e) {
      return (e as InvalidTokenError).message;
    }
  }

  try {
    const newToken = await session(
      Username,
      Password,
      Region,
      ClientId,
      TokenType,
      ClientSecret
    );
    token = newToken;
    return newToken;
  } catch (error) {
    return (error as Error).message;
  }
}

export default getUserPasswordAccessToken;
