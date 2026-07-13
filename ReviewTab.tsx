import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, FileCode2 } from 'lucide-react';
import { ConfigInputFormValues } from '@/lib/schemas';

interface ReviewTabProps {
  form: UseFormReturn<ConfigInputFormValues>;
  configId?: number;
}

export default function ReviewTab({ form, configId }: ReviewTabProps) {
  const [yamlPreview, setYamlPreview] = useState<string>('');
  const [isGeneratingYaml, setIsGeneratingYaml] = useState(false);
  
  // Watch all form data to regenerate YAML preview client-side if creating new
  const formData = form.watch();

  useEffect(() => {
    const generatePreview = async () => {
      setIsGeneratingYaml(true);
      try {
        if (configId) {
          // If editing, try to get exact YAML from server
          const res = await fetch(`/api/configs/${configId}/yaml`);
          if (res.ok) {
            const data = await res.json();
            setYamlPreview(data.yaml);
            return;
          }
        }
        
        // Client-side simple fallback generation for new configs
        // In a real app we'd probably have an endpoint to POST the unsaved config and return YAML
        const yaml = generateClientSideYaml(formData.data);
        setYamlPreview(yaml);
      } catch (err) {
        console.error("Failed to generate preview", err);
        setYamlPreview("# Failed to generate YAML preview\n" + generateClientSideYaml(formData.data));
      } finally {
        setIsGeneratingYaml(false);
      }
    };

    const timer = setTimeout(generatePreview, 500); // Debounce to avoid constant generation while typing
    return () => clearTimeout(timer);
  }, [formData, configId]);

  const handleDownload = () => {
    const blob = new Blob([yamlPreview], { type: 'text/yaml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.name || 'config'}.yaml`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="space-y-8">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Configuration Details</CardTitle>
            <CardDescription>
              Name and describe this configuration for the control plane dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Configuration Name</FormLabel>
                  <FormControl>
                    <Input placeholder="prod-k8s-agent" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Monitors prod-cluster syslog and auto-patches OOMs" 
                      className="resize-none" 
                      {...field} 
                      value={field.value || ''} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-sm flex flex-col h-full overflow-hidden">
        <CardHeader className="bg-muted/30 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode2 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">config.yaml Preview</CardTitle>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleDownload} disabled={!yamlPreview || isGeneratingYaml}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-grow relative bg-card">
          {isGeneratingYaml ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 backdrop-blur-sm z-10">
              <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mb-4" />
              <p className="text-sm font-mono text-muted-foreground">Generating YAML...</p>
            </div>
          ) : null}
          <div className="h-full w-full min-h-[400px] max-h-[600px] overflow-auto bg-[#1a1b26] p-4 text-[#a9b1d6] font-mono text-sm leading-relaxed whitespace-pre font-light">
            {yamlPreview || (
              <span className="text-muted-foreground italic"># Waiting for configuration data...</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Simple fallback YAML generator for client-side preview
function generateClientSideYaml(data: any): string {
  if (!data) return '';
  
  let yaml = '';
  
  // Sources
  if (data.sources && data.sources.length > 0) {
    yaml += 'sources:\n';
    data.sources.forEach((s: any) => {
      yaml += `  - type: ${s.type}\n`;
      if (s.path) yaml += `    path: ${s.path}\n`;
      if (s.projectId) yaml += `    project_id: ${s.projectId}\n`;
      if (s.subscriptionId) yaml += `    subscription_id: ${s.subscriptionId}\n`;
    });
  }

  // LLM
  if (data.llm) {
    yaml += '\nllm:\n';
    yaml += `  provider: ${data.llm.provider}\n`;
    if (data.llm.model && data.llm.provider !== 'stub') yaml += `  model: ${data.llm.model}\n`;
    
    if (data.llm.provider === 'gemini') {
      if (data.llm.backend) yaml += `  backend: ${data.llm.backend}\n`;
      if (data.llm.project) yaml += `  project: ${data.llm.project}\n`;
      if (data.llm.location) yaml += `  location: ${data.llm.location}\n`;
      if (data.llm.apiKeyEnv) yaml += `  api_key_env: ${data.llm.apiKeyEnv}\n`;
    }
    
    if (data.llm.baseUrl) yaml += `  base_url: ${data.llm.baseUrl}\n`;
    if (data.llm.host) yaml += `  host: ${data.llm.host}\n`;
    
    if (data.llm.fallbacks && data.llm.fallbacks.length > 0) {
      yaml += '  fallbacks:\n';
      data.llm.fallbacks.forEach((f: any) => {
        yaml += `    - kind: ${f.kind}\n`;
        yaml += `      model: ${f.model}\n`;
        if (f.backend) yaml += `      backend: ${f.backend}\n`;
        if (f.project) yaml += `      project: ${f.project}\n`;
        if (f.location) yaml += `      location: ${f.location}\n`;
      });
    }
  }

  // Output
  if (data.output) {
    yaml += '\noutput:\n';
    yaml += `  dir: ${data.output.dir}\n`;
  }

  // Target
  if (data.target) {
    yaml += `\ntarget: ${data.target}\n`;
    
    if (data.target === 'github' && data.github) {
      yaml += 'github:\n';
      if (data.github.owner) yaml += `  owner: ${data.github.owner}\n`;
      if (data.github.repo) yaml += `  repo: ${data.github.repo}\n`;
      if (data.github.baseBranch) yaml += `  base_branch: ${data.github.baseBranch}\n`;
    }
    
    if (data.target === 'gitlab' && data.gitlab) {
      yaml += 'gitlab:\n';
      if (data.gitlab.project) yaml += `  project: ${data.gitlab.project}\n`;
      if (data.gitlab.baseBranch) yaml += `  base_branch: ${data.gitlab.baseBranch}\n`;
      if (data.gitlab.baseUrl) yaml += `  base_url: ${data.gitlab.baseUrl}\n`;
    }
  }

  // Validator
  if (data.validator) {
    yaml += `\nvalidator: ${data.validator}\n`;
  }

  // Log
  if (data.log) {
    yaml += '\nlog:\n';
    yaml += `  level: ${data.log.level}\n`;
    yaml += `  format: ${data.log.format}\n`;
  }

  // Tracing
  if (data.tracing) {
    yaml += '\ntracing:\n';
    yaml += `  exporter: ${data.tracing.exporter}\n`;
    if (data.tracing.project && data.tracing.exporter === 'cloudtrace') {
      yaml += `  project: ${data.tracing.project}\n`;
    }
  }

  return yaml;
}
