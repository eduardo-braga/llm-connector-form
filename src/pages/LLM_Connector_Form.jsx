import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function AiApiCallForm() {
  const [stepName, setStepName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [outputExample, setOutputExample] = useState("");
  const [jsonSchema, setJsonSchema] = useState("");

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-8 px-4">
      <h1 className="text-2xl font-semibold text-gray-800">LLM Connector</h1>

      <Tabs defaultValue="provider">
        <TabsList>
          <TabsTrigger value="provider">Provider & Model</TabsTrigger>
          <TabsTrigger value="output">Output Definition</TabsTrigger>
        </TabsList>

        <TabsContent value="provider">
          <Card>
            <CardContent className="space-y-4 py-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Step Name</label>
                <Input value={stepName} onChange={(e) => setStepName(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Prompt</label>
                <Textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                <p className="text-xs text-muted-foreground italic">
                  Use double braces <code>{'{{variable}}'}</code> to access variables
                </p>
              </div>

              <Button className="w-full">Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="output">
          <Card>
            <CardContent className="space-y-4 py-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">Output Example</label>
                <Textarea rows={5} value={outputExample} onChange={(e) => setOutputExample(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-muted-foreground">JSON Schema</label>
                <Textarea rows={6} value={jsonSchema} onChange={(e) => setJsonSchema(e.target.value)} />
              </div>

              <Button className="w-full">Validate</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
