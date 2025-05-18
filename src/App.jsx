import React, { useState } from "react";

export default function App() {
  const [stepName, setStepName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [outputExample, setOutputExample] = useState("{\n  \"answer\": \"...\"\n}");
  const [jsonSchema, setJsonSchema] = useState(`{\n  \"type\": \"object\",\n  \"properties\": {\n    \"answer\": { \"type\": \"string\" }\n  }\n}`);

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-lg space-y-6">
      <h1 className="text-3xl font-bold text-blue-600">LLM Connector</h1>

      <div className="space-y-2">
        <label className="block font-medium">Step Name</label>
        <input
          type="text"
          className="w-full border border-gray-300 rounded px-4 py-2"
          value={stepName}
          onChange={(e) => setStepName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block font-medium">Prompt</label>
        <textarea
          className="w-full border border-gray-300 rounded px-4 py-2"
          rows={6}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block font-medium">Output Example</label>
        <textarea
          className="w-full border border-gray-300 rounded px-4 py-2 font-mono"
          rows={6}
          value={outputExample}
          onChange={(e) => setOutputExample(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="block font-medium">JSON Schema</label>
        <textarea
          className="w-full border border-gray-300 rounded px-4 py-2 font-mono"
          rows={8}
          value={jsonSchema}
          onChange={(e) => setJsonSchema(e.target.value)}
        />
      </div>

      <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition w-full">
        Save
      </button>
    </div>
  );
}
