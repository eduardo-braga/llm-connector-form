import React, { useRef, useState, useEffect } from "react";
import { toast } from 'sonner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { X, Plus, CheckCircle, Code2, ArrowDown, HelpCircle, Save, List } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { python } from "@codemirror/lang-python";
import { quietlight } from "@uiw/codemirror-theme-quietlight";
import { EditorView } from "@codemirror/view";
import { Tooltip, TooltipTrigger, TooltipContent,TooltipProvider} from "@/components/ui/tooltip";

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
  OpenAI: ["gpt-4o","gpt-4.1", "o3", "o3‑mini", "o4‑mini"],
  Anthropic: ["claude-3-opus","claude-3-sonnet","claude-3-haiku"],
  Google: ["gemini-1.5-pro-latest","gemini-1.5-flash-latest","gemini-pro","gemini-pro-vision"],
  DeepSeek: ["deepseek-coder","deepseek-coder-instruct","deepseek-chat"],
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
  }/*,
  "langfuse": {
    label: "Langfuse",
    icon: "/logos/langfuse.png"
  },
  "openai-evals": {
    label: "OpenAI Evals",
    icon: "/logos/openai.svg"
  }*/
};

const promptExample = `You are an evaluator specialized in ......

Check if my output response contains any ......

-----DO NOT CHANGE BEYOND THIS LINE------
Respond ONLY in this JSON format:

{
  "[score_field]": float (0.0 to 1.0),
  "explanation": "A short explanation of the score."
}`;

const evaluationCategories = {
  "Structural/Format": ["format_check", "regex", "keyword_presence", "response_lenght"],
  "Content Safety": ["toxicity_check", "bias_detection", "hate_speech"],
  "Factual Integrity": ["hallucination_check", "factual_consistency", "faithfulness"],
  "Semantic Quality": ["answer_relevance", "instruction_following", "completenes", "coherence", "conciseness_verbosity", "reasoning_quality"],
  "Custom": ["custom"]
};

const typesWithoutScoreAndRetry = ["format_check", "regex", "keyword_presence", "response_lenght"];

const evaluationTypeLabels = {
  "format_check": "Format Check (Offline)",
  "regex": "Regex Pattern Validation (Offline)",
  "keyword_presence": "Keyword Presence (Offline)",
  "response_lenght": "Response Length Check (Offline)",
  "toxicity_check": "Toxicity Check (Online)",
  "bias_detection": "Bias Detection (Online)",
  "hate_speech": "Hate Speech / Threats (Online)",
  "hallucination_check": "Hallucination Check (Online)",
  "factual_consistency": "Factual Consistency (Online)",
  "faithfulness": "Faithfulness (Online)",
  "answer_relevance": "Answer Relevance (Online)",
  "instruction_following": "Instruction Following (Online)",
  "completenes": "Completeness (Online)",
  "coherence": "Coherence (Online)",
  "conciseness_verbosity": "Conciseness / Verbosity (Online)",
  "reasoning_quality": "Reasoning Quality (Online)",
  "custom": "Custom Prompt (Online)"
};

const savedPrompts = [
  {
    label: "Bullet Summary",
    value: "Summarize the key points about AI in education in 3 clear bullet points."
  },
  {
    label: "Executive Summary",
    value: "Write an executive summary highlighting the main impacts of AI in education in a short paragraph."
  },
  {
    label: "One-Sentence Summary",
    value: "Summarize the role of AI in education in a single, concise sentence."
  }
];

const getDescription = (value) => {
  const descriptions = {
    "format_check": "Verifies if the output matches the expected structural format.",
    "regex": "Checks if the output matches a defined regex pattern.",
    "keyword_presence": "Checks whether specific keywords are present in the response.",
    "response_lenght": "Ensures the response length meets expected constraints.",
    "toxicity_check": "Detects toxic, offensive, or harmful language in the output.",
    "bias_detection": "Detects biased or unfair statements.",
    "hate_speech": "Identifies hate speech, threats, or abusive content.",
    "hallucination_check": "Checks whether the output contains made-up or hallucinated facts.",
    "factual_consistency": "Ensures the output is factually consistent with the input context.",
    "faithfulness": "Measures if the output faithfully represents the source or input.",
    "answer_relevance": "Checks whether the answer is relevant to the question.",
    "instruction_following": "Evaluates if the response correctly follows instructions.",
    "completenes": "Verifies whether the response fully answers the question.",
    "coherence": "Checks whether the output is logically organized and consistent.",
    "conciseness_verbosity": "Evaluates if the output is concise or overly verbose.",
    "reasoning_quality": "Measures logical reasoning quality in the response.",
    "custom": "Define your own evaluation logic with a custom prompt."
  };

  return descriptions[value] || "";
};


export default function AiApiCallForm() {
  
  const [provider, setProvider] = useState("OpenAI");
  const [providerUrl, setProviderUrl] = useState("");
  const [account, setAccount] = useState("");
  const [account2, setAccount2] = useState("");
  const [models, setModels] = useState(providerModels["OpenAI"]);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const [temperature, setTemperature] = useState(0.1);
  const [top_p, setTop_p] = useState(0.9);
  const [top_k, setTop_k] = useState(50);
  const [maxTokens, setMaxTokens] = useState("2048");
  const [userPrompt, setUserPrompt] = useState("");
  const [showPromptDropdown, setShowPromptDropdown] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [fileInputs, setFileInputs] = useState([""]);
  
  const [allowWebSearch, SetAllowWebSearch] = useState(false);
  const [webSearch, setWebSearch] = useState({search_engine: "google",site_restriction: "",region: "us",language: "en",num_results: 10,date_range: "",exclude_keywords: "",query_boost: "",follow_links_depth: 1,cache_ttl: 3600,safe_search: false,rerank_results: true});

  const [toolChoice, setToolChoice] = useState("auto");
  const [tools, setTools] = useState([]);
  
  const [outputExample, setOutputExample] = useState("{\n  \"name\": \"John Doe\",\n  \"age\": 40,\n  \"active\": true,\n  \"hobbies\": [\"reading\",  \"gaming\",  \"music\" ]\n}");
  const [jsonSchema, setJsonSchema] = useState(`{\n  \"type\": \"object\",\n  \"properties\": {\n    \"answer\": { \"type\": \"string\" }\n  }\n}`);
  const [outputValidation, setOutputValidation] = useState("");
  const [schemaValidation, setSchemaValidation] = useState("");
  
  const [evaluatorTool, setEvaluatorTool] = useState("");
  const [sendToEvaluationTool, setSendToEvaluationTool] = useState(false);
  const [evaluations, setEvaluations] = useState([{ category: "", type: "", customDef: promptExample, format: "XML" , regex: "", keywords: "", responseLengthType: "character",  maxResponseLength: ""}]);
  
  const [backgroundMode, SetBackgroundMode] = useState(false);
  

  const addFileInput = () => setFileInputs([...fileInputs, ""]);

  const removeFileInput = (index) => setFileInputs(fileInputs.filter((_, i) => i !== index));

  const handleFileInputChange = (index, value) => {
    const updated = [...fileInputs];
    updated[index] = value;
    setFileInputs(updated);
  };

  useEffect(() => {
    if (!sendToEvaluationTool) {
      setEvaluatorTool("");
      setAccount2("");
    }
  }, [sendToEvaluationTool]);

  useEffect(() => {
    setModels(providerModels[provider]);
    setSelectedModel(providerModels[provider][0]);
  }, [provider]);

  const handleCategoryChange = (idx, newCategory) => {
    const firstType = evaluationCategories[newCategory]?.[0] || "";
    setEvaluations((prev) =>
      prev.map((e, i) =>
        i === idx
          ? {
              ...e,
              category: newCategory,
              type: firstType // 🔥 auto select first type
            }
          : e
      )
    );
  };

  const handleAddEval = () => {
    setEvaluations([...evaluations, { category: "", type: "" }]);
  };

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
    setJsonSchema(schema);
    toast.success("Schema successfully generated!");
  } catch (e) {
    toast.error("Invalid JSON. Cannot generate schema.");
  }
};

const updateTool = (index, field, value) => {
  const updated = [...tools];
  updated[index][field] = value;
  setTools(updated);
};

const addTool = () => {
  setTools([
    ...tools,
    {
      name: "",
      description: "",
      parameters: `{
  "type": "object",
  "properties": {},
  "required": []
}`
    }
  ]);
};

const removeTool = (index) => {
  setTools(tools.filter((_, i) => i !== index));
};

const renderedToolChoices = tools
  .filter((tool) => typeof tool.name === "string" && tool.name.trim() !== "")
  .map((tool, index) => (
    <SelectItem key={index} value={tool.name}>
      Force: {tool.name}
    </SelectItem>
  ));

const dropdownRef = useRef(null);

useEffect(() => {
  function handleClickOutside(event) {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setShowPromptDropdown(false);
    }
  }

  if (showPromptDropdown) {
    document.addEventListener("mousedown", handleClickOutside);
  } else {
    document.removeEventListener("mousedown", handleClickOutside);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [showPromptDropdown]);

const generateOpenAIResponsesAPIBody = () => {
  // Basic validation with toast feedback
  if (!userPrompt || userPrompt.trim() === "") {
    toast.error("Please enter a user prompt before generating the request body.");
    throw new Error("User prompt is required.");
  }

  if (!selectedModel || selectedModel.trim() === "") {
    toast.error("Please select a model before generating the request body.");
    throw new Error("Model is required.");
  }

  const input = [];

  // Generate dynamic web search instructions from fields
  const webContextFromFields = () => {
    if (!allowWebSearch || !webSearch) return "";

    const {
      search_engine,
      site_restriction,
      region,
      language,
      num_results,
      date_range,
      result_format,
      snippet_length,
      exclude_keywords,
      query_boost,
      follow_links_depth,
      cache_ttl,
      safe_search,
      rerank_results
    } = webSearch;

    const details = [];

    if (search_engine) details.push(`Use "${search_engine}" as the search engine.`);
    if (site_restriction) details.push(`Limit search to "${site_restriction}".`);
    if (region) details.push(`Focus results on the "${region}" region.`);
    if (language) details.push(`Preferred language is "${language}".`);
    if (num_results) details.push(`Return up to ${num_results} results.`);
    if (date_range) details.push(`Restrict results to "${date_range}".`);
    if (result_format) details.push(`Format results as "${result_format}".`);
    if (snippet_length) details.push(`Each snippet should be about ${snippet_length} characters.`);
    if (exclude_keywords?.length) details.push(`Exclude results containing: ${exclude_keywords.join(", ")}.`);
    if (query_boost?.length) details.push(`Prioritize results including: ${query_boost.join(", ")}.`);
    if (follow_links_depth) details.push(`Follow links up to ${follow_links_depth} levels deep.`);
    if (cache_ttl) details.push(`Cache results for ${cache_ttl} seconds.`);
    if (safe_search !== undefined) details.push(`Safe Search is ${safe_search ? "enabled" : "disabled"}.`);
    if (rerank_results !== undefined) details.push(`Re-rank results using AI: ${rerank_results ? "yes" : "no"}.`);

    return details.length
      ? `\n\nWeb Search Instructions:\n${details.map(d => `- ${d}`).join("\n")}`
      : "";
  };

  const fullUserPrompt = `${userPrompt.trim()}${webContextFromFields()}`;

  if (systemPrompt?.trim()) {
    input.push({
      role: "system",
      content: systemPrompt.trim(),
    });
  }

  input.push({
    role: "user",
    content: fullUserPrompt.trim(),
  });

  const body = {
    model: selectedModel,
    temperature,
    top_p,
    max_tokens: parseInt(maxTokens, 10),
    input,
    tools: [],
  };

  // Add file search if file inputs are present
  if (fileInputs?.length > 0) {
    body.tools.push("file_search");
    body.file_ids = fileInputs;
  }

  // Add web search if enabled
  if (allowWebSearch) {
    body.tools.push("web_search");
  }

  // Add backgroundMode if enabled
  if (backgroundMode) {
    body.background = true;
  }

  // Add structured output schema if provided
  if (jsonSchema) {
    try {
      const parsedSchema = typeof jsonSchema === "string" ? JSON.parse(jsonSchema) : jsonSchema;
      body.response_format = {
        type: "json_schema",
        json_schema: parsedSchema
      };
    } catch (err) {
      toast.error("Invalid JSON Schema for structured output.");
      throw new Error("Invalid JSON Schema");
    }
  }

  // Add custom tools defined in the Tools tab
  if (tools && tools.length > 0) {
    tools.forEach((tool) => {
      if (tool.name && tool.parameters) {
        try {
          const parsedParams = typeof tool.parameters === "string" ? JSON.parse(tool.parameters) : tool.parameters;
          body.tools.push({
            type: "function",
            function: {
              name: tool.name,
              description: tool.description || "",
              parameters: parsedParams,
            },
          });
        } catch (err) {
          toast.error(`Invalid JSON in parameters for function "${tool.name}".`);
          throw new Error(`Invalid JSON in tool: ${tool.name}`);
        }
      }
    });
  }

  return body;
};

  return (
    <Card className="max-w-3xl mx-auto mt-8 shadow-2xl rounded-2xl p-4">
      <CardContent>
        <h1 className="text-lg font-medium mb-2">LLM Connector</h1>
        <Input placeholder="Step Name" className="mb-4" />
        <Tabs defaultValue="provider">
          <TabsList className="grid w-full grid-cols-6 mb-2">
            <TabsTrigger value="provider">Model & Input</TabsTrigger>
            <TabsTrigger value="web">Web Search</TabsTrigger>
            <TabsTrigger value="functions">Functions</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
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
                <div className="w-1/2"/>
              </div>
              
              {/* Model & Input SubTabs */}
              <Tabs defaultValue="user">
                <TabsList className="w-full mb-2 grid grid-cols-3">
                  <TabsTrigger value="user">User Prompt</TabsTrigger>
                  <TabsTrigger value="system">System Prompt</TabsTrigger>
                  <TabsTrigger value="files">Files Input</TabsTrigger>
                </TabsList>
                
                {/* User Prompt Tab */}
                <TabsContent value="user">  
                  <div className="relative">
                    {/* Top Row: Label + Button */}
                    <div className="flex justify-between items-start mb-1">
                       <p className="text-xs text-gray-500 italic">
                          Use double braces <code className="font-mono text-gray-400">{'{{}}'}</code> to access variables
                      </p>

                      <div className="flex items-center gap-2 relative z-10">
                        {/* Save Prompt Button with Tooltip */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => {
                                    toast.success("Prompt saved!");
                                  }}
                                  className="text-sm bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 shadow"
                                >
                                  <Save size={16} className="text-black-500" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                Save current prompt
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                        {/* Saved Prompts Button */}
                        <div className="relative">
                          {/* Saved Prompts Button with Tooltip */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => setShowPromptDropdown((prev) => !prev)}
                                  className="text-sm bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 shadow"
                                >
                                  <List size={16} className="text-black-500" />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                View saved prompts
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* Saved Prompts List */}
                          {showPromptDropdown && (
                            <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded shadow z-10" ref={dropdownRef}>
                              {savedPrompts.map((example, idx) => (
                                <button
                                  key={idx}
                                  className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                                  onClick={() => {
                                    setUserPrompt(example.value);
                                    setShowPromptDropdown(false);
                                  }}
                                >
                                  {example.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* User Prompt Textarea */}
                    <Textarea
                      rows={8}
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      placeholder="What do you want to do?"
                    />
                  </div>
                </TabsContent>


                {/* System Prompt Tab */}
                <TabsContent value="system">
                  <Textarea value={systemPrompt} 
                    rows={8} 
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    placeholder="Define the AI's behavior, tone, personality, and boundaries here." />
                </TabsContent>
                
                <TabsContent value="files">
                  <p className="text-xs text-gray-500 italic mb-2">
                          Use double braces <code className="font-mono text-gray-400">{'{{}}'}</code> to reference the files
                      </p>
                  {fileInputs.map((file, index) => (
                    <div key={index} className="flex gap-2 items-center mb-2">
                      <Input
                        value={file}
                        onChange={(e) => handleFileInputChange(index, e.target.value)}
                        placeholder={`File path or id ${index + 1}`}
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

          <TabsContent value="web">
              {/* Prompt Web Search */}
              <div className="flex items-center gap-4">
                <label className="block text-sm font-medium text-muted-foreground">Use web search to get real-time information?</label>
                <label className="inline-flex items-center cursor-pointer">
                  <span className="relative">
                    <input
                        type="checkbox"
                        checked={allowWebSearch}
                        onChange={(e) => SetAllowWebSearch(e.target.checked)}
                        className="sr-only peer"
                      />
                    <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-black transition-all duration-300"></div>
                    <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform peer-checked:translate-x-full transition-transform duration-300"></div>
                  </span>
                </label>
              </div>
              {allowWebSearch && (
                <TooltipProvider delayDuration={100}>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Search Engine</label>
                      <Tooltip><TooltipTrigger asChild><HelpCircle className="w-3 h-3" /></TooltipTrigger><TooltipContent>Define which search engine to use</TooltipContent></Tooltip>
                    </div>
                    <Input value={webSearch.search_engine} onChange={(e) => setWebSearch(prev => ({ ...prev, search_engine: e.target.value }))} placeholder="google, bing, duckduckgo" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Site Restriction</label>
                      <Tooltip><TooltipTrigger asChild><HelpCircle className="w-3 h-3" /></TooltipTrigger><TooltipContent>Limit search to a specific site</TooltipContent></Tooltip>
                    </div>
                    <Input value={webSearch.site_restriction} onChange={(e) => setWebSearch(prev => ({ ...prev, site_restriction: e.target.value }))} placeholder="site:techcrunch.com" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Region</label>
                      <Tooltip><TooltipTrigger asChild><HelpCircle className="w-3 h-3" /></TooltipTrigger><TooltipContent>Localize search results</TooltipContent></Tooltip>
                    </div>
                    <Input value={webSearch.region} onChange={(e) => setWebSearch(prev => ({ ...prev, region: e.target.value }))} placeholder="us, br" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Language</label>
                      <Tooltip><TooltipTrigger asChild><HelpCircle className="w-3 h-3" /></TooltipTrigger><TooltipContent>Set preferred result language</TooltipContent></Tooltip>
                    </div>
                    <Input value={webSearch.language} onChange={(e) => setWebSearch(prev => ({ ...prev, language: e.target.value }))} placeholder="en, pt-BR" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Number of Results</label>
                      <Tooltip><TooltipTrigger asChild><HelpCircle className="w-3 h-3" /></TooltipTrigger><TooltipContent>Number of results to retrieve</TooltipContent></Tooltip>
                    </div>
                    <Input type="number" value={webSearch.num_results} onChange={(e) => setWebSearch(prev => ({ ...prev, num_results: e.target.value }))} placeholder="5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Date Range</label>
                      <Tooltip><TooltipTrigger asChild><HelpCircle className="w-3 h-3" /></TooltipTrigger><TooltipContent>Limit to a time period</TooltipContent></Tooltip>
                    </div>
                    <Input value={webSearch.date_range} onChange={(e) => setWebSearch(prev => ({ ...prev, date_range: e.target.value }))} placeholder="past 24 hours" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Exclude Keywords</label>
                      <Tooltip><TooltipTrigger asChild><HelpCircle className="w-3 h-3" /></TooltipTrigger><TooltipContent>Filter out results with these keywords</TooltipContent></Tooltip>
                    </div>
                    <Input value={webSearch.exclude_keywords} onChange={(e) => setWebSearch(prev => ({ ...prev, exclude_keywords: e.target.value }))} placeholder="forum, reddit" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Query Boost</label>
                      <Tooltip><TooltipTrigger asChild><HelpCircle className="w-3 h-3" /></TooltipTrigger><TooltipContent>Add weight to certain keywords</TooltipContent></Tooltip>
                    </div>
                    <Input value={webSearch.query_boost} onChange={(e) => setWebSearch(prev => ({ ...prev, query_boost: e.target.value }))} placeholder="official, 2025" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Follow Links Depth</label>
                      <Tooltip><TooltipTrigger asChild><HelpCircle className="w-3 h-3" /></TooltipTrigger><TooltipContent>Depth for link crawling</TooltipContent></Tooltip>
                    </div>
                    <Input type="number" value={webSearch.follow_links_depth} onChange={(e) => setWebSearch(prev => ({ ...prev, follow_links_depth: e.target.value }))} placeholder="1" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Cache TTL</label>
                      <Tooltip><TooltipTrigger asChild><HelpCircle className="w-3 h-3" /></TooltipTrigger><TooltipContent>Cache duration in seconds</TooltipContent></Tooltip>
                    </div>
                    <Input type="number" value={webSearch.cache_ttl} onChange={(e) => setWebSearch(prev => ({ ...prev, cache_ttl: e.target.value }))} placeholder="3600" />
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox id="safe_search" checked={webSearch.safe_search} onCheckedChange={(value) => setWebSearch(prev => ({ ...prev, safe_search: value }))} />
                    <label htmlFor="safe_search" className="text-sm">Enable Safe Search</label>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Checkbox id="rerank_results" checked={webSearch.rerank_results} onCheckedChange={(value) => setWebSearch(prev => ({ ...prev, rerank_results: value }))} />
                    <label htmlFor="rerank_results" className="text-sm">Rerank Results</label>
                  </div>
                </div>
              </TooltipProvider>
              )}
          </TabsContent>
         
          <TabsContent value="functions">
            
            {provider != "OpenAI" && (
            <div className="space-y-4 mb-4">
              <label className="text-sm font-medium text-muted-foreground">Tool Choice</label>
              <Select value={toolChoice} onValueChange={setToolChoice}>
                <SelectTrigger className="h-8 text-sm px-2">
                  <SelectValue placeholder="Select tool choice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                {renderedToolChoices}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 italic">
                  Defined functions will appear in the Tool Choice dropdown so you can force the model to call a specific one.
              </p>
            </div>
            )}

            <div className="flex flex-col gap-4">
              {tools.map((tool, index) => (
                <Card key={index} className="relative shadow rounded-xl">
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500" onClick={() => removeTool(index)}>
                        <X size={18} />
                      </button>
                      
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Name
                      </label>
                      <Input
                        value={tool.name}
                        onChange={(e) => updateTool(index, "name", e.target.value)}
                        placeholder="Function name"
                      />
                    </div>
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                          Description
                      </label>
                      <Textarea
                        value={tool.description}
                        onChange={(e) => updateTool(index, "description", e.target.value)}
                        placeholder="Function description"
                      />
                    </div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Parameters (JSON Schema)
                    </label>
                    <CodeMirror
                      value={tool.parameters}
                      height="200px"
                      theme={ quietlight }
                      basicSetup={{
                              highlightActiveLine: false,
                              highlightActiveLineGutter: false
                      }}
                      extensions={[json()]}
                      className="font-mono border rounded"
                      onChange={(value) => updateTool(index, "parameters", value)}
                    />
                  </CardContent>
                </Card>
              ))}

              <Button variant="outline" onClick={addTool} className="flex gap-2 items-center w-fit self-start">
                <Plus size={18} />  Add Function
              </Button>
            </div>
          </TabsContent>


         <TabsContent value="output">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-muted-foreground">Output Example (Optional)</label>
                  <div className="flex gap-2">
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => formatJson(setOutputExample, outputExample)}
                            className="text-sm bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 shadow"
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
                            className="text-sm bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 shadow"
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
                            className="text-sm bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 shadow"
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
                  basicSetup={{
                          highlightActiveLine: false,
                          highlightActiveLineGutter: false
                  }}
                  extensions={[json()]}
                  onChange={(val) => setOutputExample(val)}
                  className="font-mono border rounded"
                />
                {outputValidation && <div className="text-sm mt-1 text-gray-600">{outputValidation}</div>}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-muted-foreground">JSON Schema (Optional)</label>
                  <div className="flex gap-2">
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => formatJson(setJsonSchema, jsonSchema)}
                            className="text-sm bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 shadow"
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
                            className="text-sm bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 shadow"
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
                  basicSetup={{
                          highlightActiveLine: false,
                          highlightActiveLineGutter: false
                  }}
                  extensions={[json()]}
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
                  <div className="mb-4 mt-4">
                    <label className="block text-sm font-medium text-muted-foreground">Evaluation Category</label>
                  <div className="flex flex-col gap-4">
                    <Select value={evaluation.category} onValueChange={(val) => handleCategoryChange(idx, val)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select evaluation category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(evaluationCategories).map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="mb-4 mt-4">
                    <div className="flex items-center gap-4">
                      <label className="block text-sm font-medium text-muted-foreground">
                        Evaluation Type
                      </label>
                      <label className="text-sm font-normal text-gray-400 italic">
                        Online evaluations call the configured LLM
                      </label>
                    </div>
                    <Select
                      value={evaluation.type}
                      onValueChange={(val) => handleEvalChange(idx, "type", val)}
                      disabled={!evaluation.category}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {evaluation.type
                            ? evaluationTypeLabels[evaluation.type]
                            : evaluation.category
                            ? "Select evaluation type"
                            : "Select category first"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(evaluationCategories[evaluation.category] || []).map((type) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex flex-col">
                              <span>{evaluationTypeLabels[type]}</span>
                              <span className="text-xs text-gray-400 italic">
                                {getDescription(type)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>    
                  </div>
                  
                  {evaluation.type === "custom" && (
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-muted-foreground">
                        Evaluation Prompt
                      </label>
                      <CodeMirror
                        value={evaluation.customDef}
                        extensions={[json()]}
                        onChange={(value) => handleEvalChange(idx, "customDef", value)}
                        height="100px"
                        theme={quietlight}
                        basicSetup={{
                          highlightActiveLine: false,
                          highlightActiveLineGutter: false
                        }}
                      />
                    </div>
                  )}

                  {evaluation.type === "format_check" && (
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Select Format
                      </label>
                      <Select
                        value={evaluation.format}
                        onValueChange={(val) => handleEvalChange(idx, "format", val)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="JSON">JSON</SelectItem>
                          <SelectItem value="XML">XML</SelectItem>
                          <SelectItem value="HTML">HTML</SelectItem>
                          <SelectItem value="CSV">CSV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {evaluation.type === "regex" && (
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Regex Expression
                      </label>
                      <Input
                        placeholder="e.g. ^[A-Za-z0-9]+$"
                        value={evaluation.regex}
                        onChange={(e) => handleEvalChange(idx, "regex", e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}

                  {evaluation.type === "keyword_presence" && (
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Keywords (comma separated)
                      </label>
                      <Input
                        placeholder="e.g. apple, banana, orange"
                        value={evaluation.keywords}
                        onChange={(e) => handleEvalChange(idx, "keywords", e.target.value)}
                        className="w-full"
                      />
                    </div>
                  )}

                  {evaluation.type === "response_lenght" && (
                    <div className="mb-2">
                      <div className="flex gap-4">
                        <div className="w-1/2">
                          <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Type
                          </label>
                          <Select
                            value={evaluation.responseLengthType}
                            onValueChange={(val) => handleEvalChange(idx, "responseLengthType", val)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="character">Character Count</SelectItem>
                              <SelectItem value="word">Word Count</SelectItem>
                              <SelectItem value="token">Token Count</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="w-1/2">
                          <label className="block text-sm font-medium text-muted-foreground mb-1">
                            Maximum Count
                          </label>
                          <Input
                            type="number"
                            min="1"
                            placeholder="e.g. 500"
                            value={evaluation.maxResponseLength}
                            onChange={(e) => handleEvalChange(idx, "maxResponseLength", e.target.value)}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}


                  {!typesWithoutScoreAndRetry.includes(evaluation.type) && (
                  <div className="flex gap-4 mt-4">
                    <div className="w-1/2">
                      <label className="block text-sm font-medium text-muted-foreground">Minimum Expected Score</label>
                        <Input type="number" min="0" max="1" step="0.05" value={parseFloat(evaluation.score || 0.8).toFixed(2)} onChange={(e) => handleEvalChange(idx, 'target', e.target.value)} /> 
                    </div>
                    <div className="w-1/2">
                      <label className="block text-sm font-medium text-muted-foreground">Number of Retries</label>
                        <Input type="number" min="0" max="10" step="1" defaultValue={0} />
                    </div>
                  </div>
                   )}  

                  <div className="flex items-center gap-4 mt-4">
                      <label className="block text-sm font-medium text-muted-foreground">Stop execution if this evaluation fails?</label>
                      <label className="inline-flex items-center cursor-pointer">
                        <span className="relative">
                          <input type="checkbox" className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-black transition-all duration-300"></div>
                          <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform peer-checked:translate-x-full transition-transform duration-300"></div>
                        </span>
                      </label>
                    </div>

                </Card>
              ))}
              <Button variant="outline" onClick={handleAddEval} className="flex gap-2 items-center">
                <Plus size={18} /> Add Evaluation
              </Button>
            </div>
            <hr className="border-t border-muted my-4" />
            <div className="flex items-center gap-4">
              <label className="block text-sm font-medium text-muted-foreground">Add Evaluations to Output?</label>
              <label className="inline-flex items-center cursor-pointer">
                <span className="relative">
                  <input
                      type="checkbox"
                      className="sr-only peer"
                    />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-black transition-all duration-300"></div>
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform peer-checked:translate-x-full transition-transform duration-300"></div>
                </span>
              </label>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <label className="block text-sm font-medium text-muted-foreground">Send Evaluations to Evaluation Tool?</label>
              <label className="inline-flex items-center cursor-pointer">
                <span className="relative">
                  <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={sendToEvaluationTool}
                      onChange={(e) => setSendToEvaluationTool(e.target.checked)}
                    />
                  <div className="w-11 h-6 bg-gray-300 rounded-full peer-checked:bg-black transition-all duration-300"></div>
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform peer-checked:translate-x-full transition-transform duration-300"></div>
                </span>
              </label>
            </div>
            {sendToEvaluationTool && (
            <div className="flex gap-4 mt-4">
              <div className="w-1/2">
                <label className="block text-sm font-medium text-muted-foreground">Evaluation Tool</label>
                <Select value={evaluatorTool} onValueChange={setEvaluatorTool}>
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
                    <SelectItem value="acc2">Account Opik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            )}
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

            <div className="flex items-center gap-4">
              <label className="block text-sm font-medium text-muted-foreground">Enable Background Mode</label>
              <label className="inline-flex items-center cursor-pointer">
                <span className="relative">
                  <input 
                    value={backgroundMode} 
                    type="checkbox" 
                    className="sr-only peer" 
                    onChange={(e) => SetBackgroundMode(e.target.checked)}/>
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
                className="!w-32"
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
                  className="!w-32"
                  placeholder="Ex: 2048"
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value)}
                />
              </div>
            )}

            <div>
              <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-1">
                Model top_p
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle size={14} className="cursor-pointer text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      top_p (also called "nucleus sampling probability") specifies the cumulative<br />
                      probability threshold for selecting the next token from the model's probability distribution.<br />
                      <br />
                      Common values:<br />
                      top_p = 1.0: Equivalent to no filtering (all tokens are considered).<br />
                      top_p = 0.9: Typical default for balanced creativity and coherence.<br />
                      Lower values (e.g., 0.5): More conservative and deterministic outputs.<br />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                type="number"
                className="!w-32"
                min="0"
                max="1"
                step="0.1"
                value={parseFloat(top_p || 0).toFixed(1)}
                onChange={(e) => setTop_p(parseFloat(e.target.value))}
              />
            </div>

            {provider != "OpenAI" && (
            <div>
              <div className="flex items-center gap-1 text-sm font-medium text-muted-foreground mb-1">
                Model top_k
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle size={14} className="cursor-pointer text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      top_k specifies the number of most likely tokens the model can choose from when generating the next token.<br />
                      This limits the sampling pool to the top k highest-probability candidates, filtering out the rest.<br />
                      <br />
                      Common values:<br />
                      top_k = 0: Equivalent to no filtering (all tokens are considered).<br />
                      top_k = 50: Typical default for creative but coherent outputs.<br />
                      Lower values (e.g., 5 or 10): More focused and deterministic outputs.<br />
                      Higher values (e.g., 100 or more): Increases randomness and diversity.<br />
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input
                type="number"
                  min="1"
                  className="!w-32"
                  value={top_k}
                  onChange={(e) => setTop_k(e.target.value)}
              />
            </div>
            )}
          </div>
          </TabsContent>
        </Tabs>
        <div className="flex gap-4 mt-6">
          <Button
            className="w-[70%]"
            variant="black"
            size="lg"
            onClick={() => toast.success("Connector successfully saved!")}
          >
            Save
          </Button>
          <Button
            className="w-[30%]"
            variant="outline"
            size="lg"
            onClick={() => toast("Running connector...")}
          >
            Run
          </Button>
          {provider === "OpenAI" && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => {
                    const payload = generateOpenAIResponsesAPIBody();
                    console.log("Generated LLM Body:", payload);
                    toast.success("LLM body generated in console and clipboard");
                    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
                  }}
                  className="text-sm bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 shadow"
                >
                  <List size={16} className="text-black-500" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                Generate OpenAI Responses API Call
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>

  );
}
