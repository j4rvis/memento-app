"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateNote, deleteNote, togglePin } from "@/app/(app)/i/[slug]/notes/actions";
import { Pin, Trash2, Save, Eye, Edit } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  content: string;
  is_pinned: boolean;
}

export function NoteEditor({ note, slug }: { note: Note; slug: string }) {
  const [preview, setPreview] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => togglePin(slug, note.id)}
        >
          <Pin className={cn("h-4 w-4", note.is_pinned && "fill-current")} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setPreview(!preview)}
        >
          {preview ? <Edit className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
        <div className="flex-1" />
        <form action={async (formData) => { await updateNote(slug, note.id, formData); }}>
          <input type="hidden" name="title" value={title} />
          <input type="hidden" name="content" value={content} />
          <Button type="submit" size="sm">
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </form>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => deleteNote(slug, note.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </div>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Note title"
        className="text-lg font-semibold"
      />

      {preview ? (
        <div className="prose dark:prose-invert max-w-none rounded-md border p-4">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content || "*Empty note*"}
          </ReactMarkdown>
        </div>
      ) : (
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Write your note in Markdown..."
          className="min-h-[400px] font-mono"
        />
      )}
    </div>
  );
}
