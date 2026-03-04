import { WithAuth } from "@/lib/api/auth-protected";
import { NextResponse } from "next/server";


export const GET = WithAuth(async (req, { user, params }) => {
    const { id } = await params;
    
});