import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { APIError, handleError } from "@/lib/api/errors";
import { STATUS_CODES } from "http";
import { statusCodes } from "better-auth";
import { UserPublicSchema } from "@/lib/schemas/userschemas";

/*
* GET route handler for retrieving user details.
*/
export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        });
        if (!session) {
            throw new APIError("Failed to retrieve session.", 401)
        }

        const user = UserPublicSchema.parse(session.user)

        return Response.json({ ...user }, { status: 200 })
    } catch (error) {
        return handleError(error);
    }
}