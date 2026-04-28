import { MessageSquare } from "lucide-react";

export function ChatEmpty({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-8">
      <div className="rounded-full bg-surface p-4">
        <MessageSquare className="size-8 text-muted-foreground" />
      </div>
      <p className="font-medium text-foreground">{title}</p>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
