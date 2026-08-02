"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateContentBlock } from "@/lib/actions/content";
import { Save, Check } from "lucide-react";

export function ContentEditor({ block }: { block: { slug: string; title: string; body: string; image?: string | null } }) {
  const [loading, setLoading] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [title, setTitle] = React.useState(block.title);
  const [body, setBody] = React.useState(block.body);

  async function save() {
    setLoading(true);
    try {
      await updateContentBlock(block.slug, { title, body });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setLoading(false); }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{block.title}</CardTitle>
        <code className="text-xs text-muted-foreground">{block.slug}</code>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2"><Label>Titre</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="space-y-2"><Label>Contenu</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} /></div>
        <Button onClick={save} disabled={loading} size="sm">
          {saved ? <><Check className="h-4 w-4" /> Enregistré</> : <><Save className="h-4 w-4" /> {loading ? "..." : "Enregistrer"}</>}
        </Button>
      </CardContent>
    </Card>
  );
}