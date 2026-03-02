import "server-only";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation";


export async function createQuiz(rawData: any)