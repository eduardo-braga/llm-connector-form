import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { X, Plus, CheckCircle, Code2, ArrowDown } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { quietlight } from "@uiw/codemirror-theme-quietlight";
import { EditorView } from "@codemirror/view";

const noHighlightLine = EditorView.theme({
  ".cm-activeLine": {
    backgroundColor: "transparent !important"
  },
  ".cm-activeLineGutter": {
    backgroundColor: "transparent !important"
  }
});

const providerLabels = {
  OpenAI: "OpenAI ChatGPT",
  Anthropic: "Anthropic Claude",
  Google: "Google Gemini",
  DeepSeek: "DeepSeek",
  Custom: "Custom"
};

const providerIcons = {
  OpenAI: "/logos/openai.svg",
  Anthropic: "/logos/claude.svg",
  Google: "/logos/gemini.svg",
  DeepSeek: "/logos/deepseek.svg",
  Custom: "/logos/custom.svg"
};

const providerModels = {
  OpenAI: ["gpt-4o", "gpt-4-turbo"],
  Anthropic: ["claude-3-opus", "claude-3-sonnet"],
  Google: ["gemini-pro"],
  DeepSeek: ["deepseek-coder"],
  Custom: ["custom"]
};

const evaluatorOptions = {
  "arize": {
    label: "Arize",
    icon: "/logos/arize.png"
  },
  "opik": {
    label: "Opik",
    icon: "/logos/opik.svg"
  },
  "langfuse": {
    label: "Langfuse",
    icon: "/logos/langfuse.png"
  },
  "openai-evals": {
    label: "OpenAI Evals",
    icon: "/logos/openai.svg"
  }
};

export default function AiApiCallForm() {
  const [temperature, setTemperature] = useState(0);
  const [provider, setProvider] = useState("OpenAI");
  const [models, setModels] = useState(providerModels["OpenAI"]);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [evaluations, setEvaluations] = useState([{ tool: "", type: "builtin", target: "", retries: 1, customDef: "" }]);
  const [outputExample, setOutputExample] = useState("{\n  \"answer\": \"...\"\n}");
  const [jsonSchema, setJsonSchema] = useState(`{\n  \"type\": \"object\",\n  \"properties\": {\n    \"answer\": { \"type\": \"string\" }\n  }\n}`);
  const [outputValidation, setOutputValidation] = useState("");
  const [schemaValidation, setSchemaValidation] = useState("");
  const [fileInputs, setFileInputs] = useState([""]);

  const addFileInput = () => setFileInputs([...fileInputs, ""]);

  const removeFileInput = (index) => setFileInputs(fileInputs.filter((_, i) => i !== index));

  const handleFileInputChange = (index, value) => {
    const updated = [...fileInputs];
    updated[index] = value;
    setFileInputs(updated);
  };

  useEffect(() => {
    setModels(providerModels[provider]);
    setSelectedModel(providerModels[provider][0]);
  }, [provider]);

  const handleAddEval = () => setEvaluations([...evaluations, { tool: "", type: "builtin", target: "", retries: 1, customDef: "" }]);

  const handleEvalChange = (idx, field, value) => {
    const updated = evaluations.map((e, i) => (i === idx ? { ...e, [field]: value } : e));
    setEvaluations(updated);
  };

  const handleRemoveEval = (idx) => setEvaluations(evaluations.filter((_, i) => i !== idx));

  const formatJson = (valueSetter, jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr);
      valueSetter(JSON.stringify(parsed, null, 2));
    } catch (e) {
      alert("Invalid JSON, cannot format.");
    }
  };

  const validateJson = (jsonStr, setFeedback) => {
  try {
    JSON.parse(jsonStr);
    setFeedback("✅ Valid JSON");
  } catch (e) {
    setFeedback("❌ Invalid JSON: " + e.message);
  }
};

const generateSchemaFromExample = () => {
  try {
    const example = JSON.parse(outputExample);
    const typeOf = (value) => {
      if (Array.isArray(value)) return "array";
      if (value === null) return "null";
      return typeof value;
    };
    const buildSchema = (obj) => {
      const schema = { type: "object", properties: {}, required: [] };
      for (const key in obj) {
        const value = obj[key];
        const type = typeOf(value);
        schema.required.push(key);
        if (type === "object") {
          schema.properties[key] = buildSchema(value);
        } else if (type === "array") {
          const arrayTypes = [...new Set(value.map(typeOf))];
          schema.properties[key] = {
            type: "array",
            items: arrayTypes.length === 1
              ? arrayTypes[0] === "object"
                ? buildSchema(value[0])
                : { type: arrayTypes[0] }
              : { anyOf: arrayTypes.map(t => t === "object" ? buildSchema({}) : { type: t }) }
          };
        } else {
          schema.properties[key] = { type };
        }
      }
      return schema;
    };
    const schema = buildSchema(example);
    setJsonSchema(JSON.stringify(schema, null, 2));
  } catch (e) {
    alert("❌ Could not generate schema: " + e.message);
  }
};

  return (
    <Card className="max-w-3xl mx-auto mt-8 shadow-2xl rounded-2xl p-4">
      <CardContent>
        <h1 className="text-lg font-medium mb-2">LLM Connector</h1>
        <Input placeholder="Step Name" className="mb-4" />
        <Tabs defaultValue="provider">
          <TabsList className="grid w-full grid-cols-4 mb-2">
            <TabsTrigger value="provider">Model & Input</TabsTrigger>
            <TabsTrigger value="output">Output Definition</TabsTrigger>
            <TabsTrigger value="eval">Evaluations</TabsTrigger>
             <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="provider">
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-muted-foreground">Provider</label>
                  <Select value={provider} onValueChange={setProvider}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(providerModels).map((prov) => (
                        <SelectItem key={prov} value={prov}>
                          <div className="flex items-center gap-2">
                            <img src={providerIcons[prov]} alt={prov} className="h-4 w-4" />
                            {providerLabels[prov]}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-muted-foreground">Account</label>
                  <select className="w-full border rounded p-2">
                    <option value="acc1">Account 1</option>
                    <option value="acc2">Account 2</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-muted-foreground">Model</label>
                  <select className="w-full border rounded p-2" value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                    {models.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-muted-foreground">Temperature</label>
                    <Input type="number" min="0" max="1" step="0.1" value={parseFloat(temperature || 0).toFixed(1)} onChange={(e) => setTemperature(parseFloat(e.target.value))} />
                </div>
              </div>
              <Tabs defaultValue="user">
                <TabsList className="w-full mb-2 grid grid-cols-3">
                  <TabsTrigger value="user">User Prompt</TabsTrigger>
                  <TabsTrigger value="system">System Prompt</TabsTrigger>
                  <TabsTrigger value="files">Files</TabsTrigger>
                </TabsList>
                <TabsContent value="user">
                  <p className="text-xs text-gray-500 italic">
                      Use double braces <code className="font-mono text-gray-400">{'{{}}'}</code> to access variables
                  </p>
                  <Textarea rows={8} placeholder="What do you want to do?" />
                </TabsContent>
                <TabsContent value="system">
                  <Textarea rows={8} placeholder="Define the AI's behavior, tone, personality, and boundaries here." />
                </TabsContent>
                <TabsContent value="files">
                  <p className="text-sm text-muted-foreground mb-2">Add the file IDs already uploaded to the model</p>
                  {fileInputs.map((file, index) => (
                    <div key={index} className="flex gap-2 items-center mb-2">
                      <Input
                        value={file}
                        onChange={(e) => handleFileInputChange(index, e.target.value)}
                        placeholder={`File name ${index + 1}`}
                      />
                      <Button variant="ghost" size="icon" onClick={() => removeFileInput(index)}><X size={16} /></Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addFileInput} className="mt-2 flex items-center gap-1">
                    <Plus size={16} /> Add File
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

         <TabsContent value="output">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-muted-foreground">Output Example</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => formatJson(setOutputExample, outputExample)} title="Format JSON (Output Example)">
                      <Code2 size={16} className="text-blue-500" />
                    </button>
                    <button type="button" onClick={() => validateJson(outputExample, setOutputValidation)} title="Validate JSON (Output Example)">
                      <CheckCircle size={16} className="text-green-500" />
                    </button>
                    <button type="button" onClick={generateSchemaFromExample} title="Generate Schema from Example">
                      <ArrowDown size={16} className="text-purple-500" />
                    </button>
                  </div>
                </div>
                <CodeMirror
                  value={outputExample}
                  height="160px"
                  theme={ quietlight }
                  extensions={[json(), noHighlightLine]}
                  onChange={(val) => setOutputExample(val)}
                  className="font-mono border rounded"
                />
                {outputValidation && <div className="text-sm mt-1 text-gray-600">{outputValidation}</div>}
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-muted-foreground">JSON Schema</label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => formatJson(setJsonSchema, jsonSchema)} title="Format JSON (Schema)">
                      <Code2 size={16} className="text-blue-500" />
                    </button>
                    <button type="button" onClick={() => validateJson(jsonSchema, setSchemaValidation)} title="Validate JSON (Schema)">
                      <CheckCircle size={16} className="text-green-500" />
                    </button>
                  </div>
                </div>
                <CodeMirror
                  value={jsonSchema}
                  height="200px"
                  theme={ quietlight }
                  extensions={[json(), noHighlightLine]}
                  onChange={(val) => setJsonSchema(val)}
                  className="font-mono border rounded"
                />
                {schemaValidation && <div className="text-sm mt-1 text-gray-600">{schemaValidation}</div>}
              </div>
            </div>
          </TabsContent>


          <TabsContent value="eval">
            <div className="space-y-4">
              {evaluations.map((evaluation, idx) => (
                <Card key={idx} className="p-4 relative shadow rounded-xl">
                  <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500" onClick={() => handleRemoveEval(idx)}>
                    <X size={18} />
                  </button>
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="block text-sm font-medium text-muted-foreground">Evaluation Tool</label>
                      <Select value={evaluation.tool} onValueChange={(val) => handleEvalChange(idx, "tool", val)}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select evaluation tool..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(evaluatorOptions).map(([value, { label, icon }]) => (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-2">
                                <img src={icon} alt={label} className="w-4 h-4" />
                                {label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-1/2">
                      <label className="block text-sm font-medium text-muted-foreground">Account</label>
                      <select className="w-full border rounded p-2">
                        <option value="acc1">Account 1</option>
                        <option value="acc2">Account 2</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-4 mt-4">
                    <label className="block text-sm font-medium text-muted-foreground">Evaluation Type</label>
                    <select className="w-full border rounded p-2" value={evaluation.type} onChange={(e) => handleEvalChange(idx, 'type', e.target.value)}>
                      <option value="">Select type...</option>
                      {evaluation.tool === 'arize' && (
                        <>
                          <option value="tool_calling">Built-in: Tool Calling</option>
                          <option value="function_calling">Built-in: Function Calling</option>
                          <option value="format_check">Built-in: Format Check</option>
                          <option value="answer_relevance">Built-in: Answer Relevance</option>
                          <option value="toxicity_check">Built-in: Toxicity Check</option>
                          <option value="hallucination_check">Built-in: Hallucination Check</option>
                          <option value="instruction_following">Built-in: Instruction Following</option>
                          <option value="reasoning_quality">Built-in: Reasoning Quality</option>
                        </>
                      )}
                      {evaluation.tool === 'opik' && (
                        <>
                          <option value="equals">Heuristic: Equals</option>
                          <option value="contains">Heuristic: Contains</option>
                          <option value="hallucination">LLM-Judge: Hallucination</option>
                          <option value="context_relevance">LLM-Judge: Context Relevance</option>
                        </>
                      )}
                      {evaluation.tool === 'langfuse' && (
                        <>
                          <option value="coherence">LLM: Coherence</option>
                          <option value="conciseness">LLM: Conciseness</option>
                        </>
                      )}
                      {evaluation.tool === 'openai-evals' && (
                        <>
                          <option value="accuracy">Built-in: Accuracy</option>
                          <option value="relevance">Built-in: Relevance</option>
                          <option value="completeness">Built-in: Completeness</option>
                          <option value="similarity">Built-in: Similarity</option>
                        </>
                      )}
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  {evaluation.type === "custom" && (
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-muted-foreground">Custom Evaluation Definition</label>
                      <Textarea rows={3} value={evaluation.customDef} onChange={(e) => handleEvalChange(idx, "customDef", e.target.value)} placeholder="Custom logic or definition" />
                    </div>
                  )}
                  <div className="flex gap-4">
                    <div className="w-1/2">
                      <label className="block text-sm font-medium text-muted-foreground">Minimum Expected Score</label>
                        <Input type="number" min="0" max="1" step="0.05" value={parseFloat(evaluation.target || 0.8).toFixed(2)} onChange={(e) => handleEvalChange(idx, 'target', e.target.value)} /> 
                    </div>
                    <div className="w-1/2">
                      <label className="block text-sm font-medium text-muted-foreground">Number of Retries</label>
                        <Input type="number" min="0" max="10" step="1" defaultValue={0} />
                    </div>
                  </div>  
                </Card>
              ))}
              <Button variant="outline" onClick={handleAddEval} className="flex gap-2 items-center">
                <Plus size={18} /> Add Evaluation
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="advanced">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="block text-sm font-medium text-muted-foreground">Log Costs</label>
                <label className="inline-flex items-center cursor-pointer">
                  <span className="relative">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-black transition-all duration-300"></div>
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform peer-checked:translate-x-full transition-transform duration-300"></div>
                  </span>
                </label>
              </div>
               <div className="flex items-center gap-4">
                <label className="block text-sm font-medium text-muted-foreground">Log Evaluations</label>
                <label className="inline-flex items-center cursor-pointer">
                  <span className="relative">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-black transition-all duration-300"></div>
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform peer-checked:translate-x-full transition-transform duration-300"></div>
                  </span>
                </label>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <Button className="w-full mt-6" variant="black" size="lg" onClick={() => window.alert('Connector successfully saved!')}>Save</Button>
      </CardContent>
    </Card>
  );
}
