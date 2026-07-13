import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { ShieldAlert, Plus, Trash2, GripVertical, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ConfigInputFormValues } from '@/lib/schemas';
import { LlmConfigProvider, LlmConfigBackend, LlmFallbackKind, LlmFallbackBackend } from '@workspace/api-client-react';

interface LlmTabProps {
  form: UseFormReturn<ConfigInputFormValues>;
}

export default function LlmTab({ form }: LlmTabProps) {
  const provider = form.watch('data.llm.provider');
  const backend = form.watch('data.llm.backend');
  const isGeminiApi = provider === LlmConfigProvider.gemini && backend === LlmConfigBackend['gemini-api'];
  const isVertex = provider === LlmConfigProvider.gemini && backend === LlmConfigBackend.vertex;
  const isExternal = provider === LlmConfigProvider.openai || provider === LlmConfigProvider.anthropic;
  const isOllama = provider === LlmConfigProvider.ollama;
  const isStub = provider === LlmConfigProvider.stub;

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'data.llm.fallbacks'
  });

  return (
    <div className="space-y-8">
      <Card className="border-primary/20 shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Primary LLM Provider</CardTitle>
              <CardDescription>
                The main engine used for triage, analysis, and remediation planning.
              </CardDescription>
            </div>
            {isGeminiApi || isExternal ? (
              <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 uppercase font-mono text-[10px] tracking-wider">
                External / Non-BAA
              </Badge>
            ) : isStub ? (
              <Badge variant="outline" className="uppercase font-mono text-[10px] tracking-wider border-dashed">
                Testing
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 uppercase font-mono text-[10px] tracking-wider">
                Enterprise / BAA
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="data.llm.provider"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Provider</FormLabel>
                  <Select onValueChange={(val) => {
                    field.onChange(val);
                    // Reset fields based on provider
                    if (val === 'gemini') {
                      form.setValue('data.llm.backend', 'vertex');
                      form.setValue('data.llm.model', 'gemini-1.5-pro');
                    } else if (val === 'openai') {
                      form.setValue('data.llm.model', 'gpt-4o');
                    } else if (val === 'anthropic') {
                      form.setValue('data.llm.model', 'claude-3-5-sonnet');
                    } else if (val === 'ollama') {
                      form.setValue('data.llm.model', 'llama3');
                    } else if (val === 'stub') {
                      form.setValue('data.llm.model', 'stub');
                    }
                  }} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="font-mono">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={LlmConfigProvider.gemini}>Google Gemini</SelectItem>
                      <SelectItem value={LlmConfigProvider.anthropic}>Anthropic Claude</SelectItem>
                      <SelectItem value={LlmConfigProvider.openai}>OpenAI</SelectItem>
                      <SelectItem value={LlmConfigProvider.ollama}>Ollama (Local)</SelectItem>
                      <SelectItem value={LlmConfigProvider.stub}>Stub (Dry Run)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isStub && (
              <FormField
                control={form.control}
                name="data.llm.model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. gemini-1.5-pro" className="font-mono" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {provider === LlmConfigProvider.gemini && (
            <div className="p-4 bg-muted/30 border rounded-lg space-y-4">
              <FormField
                control={form.control}
                name="data.llm.backend"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Gemini Backend</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                      <FormControl>
                        <SelectTrigger className="font-mono w-[240px]">
                          <SelectValue placeholder="Select backend" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={LlmConfigBackend.vertex}>Vertex AI (Enterprise)</SelectItem>
                        <SelectItem value={LlmConfigBackend['gemini-api']}>Gemini API (Developer)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isVertex && (
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="data.llm.project"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GCP Project</FormLabel>
                        <FormControl>
                          <Input placeholder="my-gcp-project" className="font-mono" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="data.llm.location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GCP Location</FormLabel>
                        <FormControl>
                          <Input placeholder="us-central1" className="font-mono" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {isGeminiApi && (
                <FormField
                  control={form.control}
                  name="data.llm.apiKeyEnv"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key Environment Variable</FormLabel>
                      <FormControl>
                        <Input placeholder="GEMINI_API_KEY" className="font-mono" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>
                        The environment variable containing your Gemini API key.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
          )}

          {isExternal && (
            <div className="p-4 bg-muted/30 border rounded-lg">
              <FormField
                control={form.control}
                name="data.llm.baseUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://api.openai.com/v1" className="font-mono" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormDescription>Override for proxy endpoints or API gateways.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {isOllama && (
            <div className="p-4 bg-muted/30 border rounded-lg">
              <FormField
                control={form.control}
                name="data.llm.host"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ollama Host</FormLabel>
                    <FormControl>
                      <Input placeholder="http://localhost:11434" className="font-mono" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {isStub && (
            <Alert className="border-primary/20 bg-primary/5">
              <AlertTriangle className="h-4 w-4 text-primary" />
              <AlertTitle>Dry Run Mode</AlertTitle>
              <AlertDescription>
                The stub provider will return canned responses for testing the pipeline without making actual LLM calls.
              </AlertDescription>
            </Alert>
          )}

          {isGeminiApi && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>HIPAA / BAA Warning</AlertTitle>
              <AlertDescription className="space-y-4">
                <p>The Developer Gemini API is not covered by Google Cloud's BAA. Do not use this for processing logs containing PHI or PII.</p>
                <FormField
                  control={form.control}
                  name="data.llm.allowNonBaa"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-destructive/20 bg-background/50 p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-destructive">Acknowledge & Allow Non-BAA Provider</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-destructive"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </AlertDescription>
            </Alert>
          )}

          {isExternal && (
            <Alert variant="destructive">
              <ShieldAlert className="h-4 w-4" />
              <AlertTitle>External Third Party</AlertTitle>
              <AlertDescription className="space-y-4">
                <p>This provider requires sending sensitive infrastructure logs to an external third-party service. Ensure you have the appropriate agreements in place.</p>
                <FormField
                  control={form.control}
                  name="data.llm.allowExternal"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-destructive/20 bg-background/50 p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-destructive">Acknowledge & Allow External Data Exfiltration</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-destructive"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Fallback Chain</CardTitle>
          <CardDescription>
            Configure backup LLMs to try if the primary provider experiences downtime or rate limiting.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => {
            const fallbackKind = form.watch(`data.llm.fallbacks.${index}.kind`);
            const fallbackBackend = form.watch(`data.llm.fallbacks.${index}.backend`);
            
            return (
              <div key={field.id} className="relative flex items-start gap-4 p-4 bg-muted/30 border rounded-lg group">
                <div className="mt-8 cursor-grab text-muted-foreground hover:text-foreground">
                  <GripVertical className="h-5 w-5" />
                </div>
                
                <div className="flex-grow space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`data.llm.fallbacks.${index}.kind`}
                      render={({ field: selectField }) => (
                        <FormItem>
                          <FormLabel>Provider</FormLabel>
                          <Select onValueChange={selectField.onChange} defaultValue={selectField.value}>
                            <FormControl>
                              <SelectTrigger className="font-mono">
                                <SelectValue placeholder="Select fallback" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={LlmFallbackKind.gemini}>Google Gemini</SelectItem>
                              <SelectItem value={LlmFallbackKind.anthropic}>Anthropic Claude</SelectItem>
                              <SelectItem value={LlmFallbackKind.openai}>OpenAI</SelectItem>
                              <SelectItem value={LlmFallbackKind.ollama}>Ollama (Local)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name={`data.llm.fallbacks.${index}.model`}
                      render={({ field: inputField }) => (
                        <FormItem>
                          <FormLabel>Model</FormLabel>
                          <FormControl>
                            <Input placeholder="Model" className="font-mono" {...inputField} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  {fallbackKind === LlmFallbackKind.gemini && (
                    <div className="grid gap-4 md:grid-cols-2 pt-2 border-t">
                      <FormField
                        control={form.control}
                        name={`data.llm.fallbacks.${index}.backend`}
                        render={({ field: selectField }) => (
                          <FormItem>
                            <FormLabel>Backend</FormLabel>
                            <Select onValueChange={selectField.onChange} value={selectField.value || ''}>
                              <FormControl>
                                <SelectTrigger className="font-mono">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={LlmFallbackBackend.vertex}>Vertex AI</SelectItem>
                                <SelectItem value={LlmFallbackBackend['gemini-api']}>Gemini API</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      {fallbackBackend === LlmFallbackBackend.vertex && (
                        <FormField
                          control={form.control}
                          name={`data.llm.fallbacks.${index}.location`}
                          render={({ field: inputField }) => (
                            <FormItem>
                              <FormLabel>Location</FormLabel>
                              <FormControl>
                                <Input placeholder="us-central1" className="font-mono" {...inputField} value={inputField.value || ''} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  )}
                </div>

                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
          
          <Button 
            type="button" 
            variant="outline" 
            className="w-full border-dashed"
            onClick={() => append({ kind: LlmFallbackKind.anthropic, model: 'claude-3-haiku' })}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Fallback
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
