import http from "node:http";
import { URL } from "node:url";
import open, { apps } from "open";

let token: string | null = null;

async function getRefreshToken(code: string): Promise<string> {
  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("client_id", "5p04uva2590or81rbuk1rjh2t");
  params.append("redirect_uri", "http://localhost:3000");
  const response = await fetch(
    "https://panda-development.auth.ca-central-1.amazoncognito.com/oauth2/token",
    {
      method: "POST",
      body: params,
    }
  );

  // TODO handle errors
  const payload = await response.json();

  return payload.refresh_token;
}

async function getAccessToken(
  refreshToken: string,
  onReceivedToken: (token: string) => void
): Promise<void> {
  const response = await fetch(
    "https://cognito-idp.ca-central-1.amazonaws.com",
    {
      method: "post",
      body: JSON.stringify({
        AuthFlow: "REFRESH_TOKEN_AUTH",
        AuthParameters: {
          DEVICE_KEY: null,
          REFRESH_TOKEN: refreshToken,
        },
        ClientId: "5p04uva2590or81rbuk1rjh2t",
      }),
      headers: {
        "content-type": "application/x-amz-json-1.1",
        "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
      },
    }
  );

  // TODO handle errors
  const payload = await response.json();

  onReceivedToken(payload.AuthenticationResult.AccessToken);
}

async function getFederatedIdpAccessToken(): Promise<string> {
  // TODO take parameters

  if (token !== null) {
    return token;
  }

  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      // biome-ignore lint/style/noNonNullAssertion: TODO add proper check later
      const code = new URL(`http://localhost:3000${req.url}`).searchParams.get(
        "code"
      )!;
      res.writeHead(200);
      res.write("You can close this window");
      res.end();
      server.close();

      const refreshToken = await getRefreshToken(code);
      getAccessToken(refreshToken, (newToken) => {
        token = newToken;
        resolve(newToken);
      });
    });
    server.listen(3000);

    const url = new URL(
      "https://panda-development.auth.ca-central-1.amazoncognito.com/oauth2/authorize"
    );

    url.searchParams.append("response_type", "code");
    url.searchParams.append("idp_identifier", "nexapp.ca");
    url.searchParams.append("client_id", "5p04uva2590or81rbuk1rjh2t");
    url.searchParams.append("redirect_uri", "http://localhost:3000");

    open(url.toString(), { app: { name: apps.browser } });
  });
}

export default getFederatedIdpAccessToken;
