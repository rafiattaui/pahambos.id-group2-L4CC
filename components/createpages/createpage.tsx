'use client';

//import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
//import { Quiz } from "../dashboardComp/quizmockup";
//import GridItems from "../dashboardComp/griditems";
//import getQuizzes from "../dashboardComp/quizzes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
  CardDescription,
  CardFooter,
} from '../ui/card';
import { Plus } from 'lucide-react';

/*
async function createQuiz(){
  const url = new URL('/api/quiz', window.location.origin);

  const response = await fetch(url, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({
      quiz: {
        title: 
      }
  })
}
*/

function CreatePageItem() {
  return <div></div>;
}

export default function CreatePage() {
  const router = useRouter();

  return (
    <>
      <h1 className="font-heading mt-4 text-5xl font-bold text-white">
        Your Quizzes
      </h1>

      <div className="mt-4 grid h-full w-full grid-cols-2 rounded-2xl bg-white sm:grid-cols-3 md:grid-cols-4">
        <Card
          onClick={() => {
            router.push('/create-quiz');
          }}
          className="m-4 cursor-pointer transition-transform duration-200 hover:scale-105 hover:text-blue-500"
        >
          <CardContent className="flex h-28 items-center justify-center sm:h-40">
            <Plus className="h-20 w-20" />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
