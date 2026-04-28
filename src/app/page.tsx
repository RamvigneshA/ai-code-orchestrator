"use client";
import { CodeEditor } from "@/app/_components";

export default function Home() {
  return <div className="p-8">
    <CodeEditor value={"const x = 10; console.log(x);"} onChange={(v) => console.log(v)} />
  </div>
}