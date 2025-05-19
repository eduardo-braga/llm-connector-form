import React, { useState, useEffect } from "react";
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { X, Plus, CheckCircle, Code2, ArrowDown, HelpCircle } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { quietlight } from "@uiw/codemirror-theme-quietlight";
import { EditorView } from "@codemirror/view";
import { Tooltip, TooltipTrigger, TooltipContent,TooltipProvider} from "@/components/ui/tooltip";

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
  Custom: [""]
};

const modelsWithMaxTokens = {
  OpenAI: true,
  Anthropic: true,
  Google: true,
  DeepSeek: true,
  Custom: true
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
  const [evaluations, setEvaluations] = useState([{ tool: "", type: "", target: "", retries: 1, customDef: "" }]);
  const [outputExample, setOutputExample] = useState("{\n  \"name\": \"John Doe\",\n  \"age\": 40,\n  \"active\": true,\n  \"hobbies\": [\"reading\",  \"gaming\",  \"music\" ]\n}");
  const [jsonSchema, setJsonSchema] = useState(`{\n  \"type\": \"object\",\n  \"properties\": {\n    \"answer\": { \"type\": \"string\" }\n  }\n}`);
  const [outputValidation, setOutputValidation] = useState("");
  const [schemaValidation, setSchemaValidation] = useState("");
  const [fileInputs, setFileInputs] = useState([""]);
  const [maxTokens, setMaxTokens] = useState("2048");
  const [providerUrl, setProviderUrl] = useState("");
  const [account, setAccount] = useState("");
  const [account2, setAccount2] = useState("");

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
      toast.success("JSON successfully formatted!");
    } catch (e) {
      toast.error("Invalid JSON. Cannot format.");
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
    toast.success("Schema successfully generated!");
  } catch (e) {
    toast.error("Invalid JSON. Cannot generate schema.");
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
                  <Select value={account} onValueChange={setAccount}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a provider account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="acc1">Account OpenAI</SelectItem>
                      <SelectItem value="acc2">Account Claude</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mb-4 mt-4">
              {provider === "Custom" && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">Custom Provider URL</label>
                    <Input
                      type="url"
                      placeholder="https://your-custom-provider.com/api"
                      value={providerUrl}
                      onChange={(e) => setProviderUrl(e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-sm font-medium text-muted-foreground">Model</label>
                  {provider === "Custom" ? (
                      <Input
                        type="text"
                        placeholder="Enter custom model name"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                      />
                    ) : (
                      <Select value={selectedModel} onValueChange={setSelectedModel}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          {models.map((model) => (
                            <SelectItem key={model} value={model}>
                              {model}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
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
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => formatJson(setOutputExample, outputExample)}
                          >
                            <Code2 size={16} className="text-blue-500" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Format JSON (Output Example)
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => validateJson(outputExample, setOutputValidation)}
                          >
                            <CheckCircle size={16} className="text-green-500" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Validate JSON (Output Example)
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={generateSchemaFromExample}
                          >
                            <ArrowDown size={16} className="text-purple-500" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Generate Schema from Example
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => formatJson(setJsonSchema, jsonSchema)}
                          >
                            <Code2 size={16} className="text-blue-500" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Format JSON (Schema)
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => validateJson(jsonSchema, setSchemaValidation)}
                          >
                            <CheckCircle size={16} className="text-green-500" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          Validate JSON (Schema)
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
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
                      <Select value={account2} onValueChange={setAccount2}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select evaluation tool account" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="acc1">Account Arize</SelectItem>
                          <SelectItem value="acc2">Account OpenAI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mb-4 mt-4">
                    <label className="block text-sm font-medium text-muted-foreground">Evaluation Type</label>
                    <Select value={evaluation.type}
                      onValueChange={(val) => handleEvalChange(idx, "type", val)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        {evaluation.tool === "arize" && (
                          <>
                            <SelectItem value="tool_calling">Built-in: Tool Calling</SelectItem>
                            <SelectItem value="function_calling">Built-in: Function Calling</SelectItem>
                            <SelectItem value="format_check">Built-in: Format Check</SelectItem>
                            <SelectItem value="answer_relevance">Built-in: Answer Relevance</SelectItem>
                            <SelectItem value="toxicity_check">Built-in: Toxicity Check</SelectItem>
                            <SelectItem value="hallucination_check">Built-in: Hallucination Check</SelectItem>
                            <SelectItem value="instruction_following">Built-in: Instruction Following</SelectItem>
                            <SelectItem value="reasoning_quality">Built-in: Reasoning Quality</SelectItem>
                          </>
                        )}
                        {evaluation.tool === "opik" && (
                          <>
                            <SelectItem value="equals">Heuristic: Equals</SelectItem>
                            <SelectItem value="contains">Heuristic: Contains</SelectItem>
                            <SelectItem value="hallucination">LLM-Judge: Hallucination</SelectItem>
                            <SelectItem value="context_relevance">LLM-Judge: Context Relevance</SelectItem>
                          </>
                        )}
                        {evaluation.tool === "langfuse" && (
                          <>
                            <SelectItem value="coherence">LLM: Coherence</SelectItem>
                            <SelectItem value="conciseness">LLM: Conciseness</SelectItem>
                          </>
                        )}
                        {evaluation.tool === "openai-evals" && (
                          <>
                            <SelectItem value="accuracy">Built-in: Accuracy</SelectItem>
                            <SelectItem value="relevance">Built-in: Relevance</SelectItem>
                            <SelectItem value="completeness">Built-in: Completeness</SelectItem>
                            <SelectItem value="similarity">Built-in: Similarity</SelectItem>
                          </>
                        )}
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
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

            <div>
              <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-1">
                Model Temperature
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle size={14} className="cursor-pointer text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      Controls randomness: lower = more deterministic, higher = more creative.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                type="number"
                className="w-32"
                min="0"
                max="1"
                step="0.1"
                value={parseFloat(temperature || 0).toFixed(1)}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
              />
            </div>

            {modelsWithMaxTokens[provider] && (
              <div>
                <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-1">
                  Max Tokens
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle size={14} className="cursor-pointer text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        Maximum number of tokens the model can generate in the response.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  type="number"
                  min="1"
                  className="w-32"
                  placeholder="Ex: 2048"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                />
              </div>
            )}
          </div>
          </TabsContent>
        </Tabs>
        <Button
          className="w-full mt-6"
          variant="black"
          size="lg"
          onClick={() => toast.success("Connector successfully saved!")}
        >
          Save
        </Button>
      </CardContent>
    </Card>
  );
}
