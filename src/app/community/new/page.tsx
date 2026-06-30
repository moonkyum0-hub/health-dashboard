import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { createQuestion } from "@/app/community/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default async function NewQuestionPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-xl font-display font-semibold">질문하기</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">새 질문</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createQuestion} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">제목</Label>
              <Input id="title" name="title" required maxLength={120} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="body">내용</Label>
              <Textarea id="body" name="body" required rows={8} maxLength={4000} />
            </div>
            <Button type="submit" className="w-full rounded-full">
              질문 등록
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
