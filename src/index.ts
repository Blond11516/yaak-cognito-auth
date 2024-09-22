import type {
	CallTemplateFunctionArgs,
	Context,
	PluginDefinition,
} from "@yaakapp/api";
import run, { TokenType } from "./cognito";

export const plugin: PluginDefinition = {
	templateFunctions: [
		{
			name: "cognitoUserPassword",
			args: [
				{
					type: "text",
					name: "username",
					optional: false,
					label: "Username",
				},
				{
					type: "text",
					name: "password",
					optional: false,
					label: "Password",
				},
				{
					type: "text",
					name: "region",
					optional: false,
					label: "Region",
				},
				{
					type: "text",
					name: "clientId",
					optional: false,
					label: "Client Id",
				},
				{
					type: "select",
					name: "tokenType",
					optional: false,
					options: [
						{
							name: TokenType.Access,
							value: TokenType.Access,
						},
						{
							name: TokenType.Id,
							value: TokenType.Id,
						},
					],
					label: "Token Type",
				},
				{
					type: "text",
					name: "clientSecret",
					optional: true,
					label: "Client Secret",
				},
			],
			async onRender(
				ctx: Context,
				args: CallTemplateFunctionArgs,
			): Promise<string | null> {
				const {
					username,
					password,
					region,
					clientId,
					tokenType,
					clientSecret,
				} = args.values;
				return await run(
					username as string,
					password as string,
					region as string,
					clientId as string,
					tokenType as TokenType,
					clientSecret as string | undefined,
				);
			},
		},
	],
};
