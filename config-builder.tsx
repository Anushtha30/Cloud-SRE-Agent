import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  useGetConfig, 
  useCreateConfig, 
  useUpdateConfig, 
  getGetConfigQueryKey,
  getListConfigsQueryKey 
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, ArrowRight, Save, Database, BrainCircuit, Send, Settings, Eye, AlertTriangle } from 'lucide-react';

import { configInputSchema, ConfigInputFormValues } from '@/lib/schemas';
import SourcesTab from './tabs/SourcesTab';
import LlmTab from './tabs/LlmTab';
import DeliveryTab from './tabs/DeliveryTab';
import ValidatorLoggingTab from './tabs/ValidatorLoggingTab';
import ReviewTab from './tabs/ReviewTab';

const DEFAULT_VALUES: ConfigInputFormValues = {
  name: '',
  description: '',
  data: {
    sources: [{ type: 'file', path: '/var/log/syslog' }],
    llm: {
      provider: 'gemini',
      model: 'gemini-1.5-pro',
      backend: 'vertex',
      allowNonBaa: false,
      allowExternal: false,
      fallbacks: []
    },
    output: { dir: './patches' },
    target: 'local',
    validator: 'none',
    log: { level: 'info', format: 'json' },
    tracing: { exporter: 'none' }
  }
};

const TABS = ['sources', 'llm', 'delivery', 'validator', 'review'] as const;
type TabId = typeof TABS[number];

export default function ConfigBuilder() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEditing = !!params.id && params.id !== 'new';
  const configId = isEditing ? parseInt(params.id!, 10) : undefined;
  
  const [activeTab, setActiveTab] = useState<TabId>('sources');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existingConfig, isLoading: isFetching } = useGetConfig(configId!, {
    query: { enabled: isEditing, queryKey: getGetConfigQueryKey(configId!) }
  });

  const createMutation = useCreateConfig();
  const updateMutation = useUpdateConfig();

  const form = useForm<ConfigInputFormValues>({
    resolver: zodResolver(configInputSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange'
  });

  useEffect(() => {
    if (existingConfig && isEditing) {
      form.reset({
        name: existingConfig.name,
        description: existingConfig.description,
        data: existingConfig.data as any
      });
    }
  }, [existingConfig, isEditing, form]);

  const onSubmit = async (data: ConfigInputFormValues) => {
    try {
      if (isEditing && configId) {
        await updateMutation.mutateAsync({ id: configId, data });
        toast({ title: 'Configuration updated' });
        queryClient.invalidateQueries({ queryKey: getGetConfigQueryKey(configId) });
      } else {
        await createMutation.mutateAsync({ data });
        toast({ title: 'Configuration created' });
      }
      queryClient.invalidateQueries({ queryKey: getListConfigsQueryKey() });
      setLocation('/');
    } catch (err: any) {
      toast({ 
        title: 'Failed to save configuration', 
        description: err.error?.error || err.message || 'Unknown error', 
        variant: 'destructive' 
      });
    }
  };

  const handleNext = async () => {
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex < TABS.length - 1) {
      // Trigger validation for the current tab before moving on
      // This is basic validation, more specific logic per tab can be added
      const fieldsToValidate = getFieldsForTab(activeTab);
      const isValid = await form.trigger(fieldsToValidate as any);
      
      if (isValid) {
        setActiveTab(TABS[currentIndex + 1]);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast({ 
          title: 'Validation Error', 
          description: 'Please fix the errors on this tab before continuing.',
          variant: 'destructive'
        });
      }
    }
  };

  const handleBack = () => {
    const currentIndex = TABS.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(TABS[currentIndex - 1]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Helper to know which fields belong to which tab for validation
  const getFieldsForTab = (tab: TabId): string[] => {
    switch (tab) {
      case 'sources': return ['data.sources'];
      case 'llm': return ['data.llm'];
      case 'delivery': return ['data.target', 'data.output', 'data.github', 'data.gitlab'];
      case 'validator': return ['data.validator', 'data.log', 'data.tracing'];
      case 'review': return ['name', 'description'];
      default: return [];
    }
  };

  if (isEditing && isFetching) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-10 w-64 mb-8" />
        <Skeleton className="h-12 w-full mb-8 rounded-md" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pb-24">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="outline" size="icon" onClick={() => setLocation('/')} className="h-8 w-8 rounded-full border-dashed">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Edit Configuration' : 'New Configuration'}
          </h1>
          <p className="text-muted-foreground">Configure the Cloud SRE Agent pipeline</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="w-full">
            <TabsList className="grid grid-cols-5 mb-8 h-14 bg-muted/50 p-1 rounded-xl">
              <TabsTrigger value="sources" className="rounded-lg font-mono text-xs uppercase data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
                <Database className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">1. Sources</span>
              </TabsTrigger>
              <TabsTrigger value="llm" className="rounded-lg font-mono text-xs uppercase data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
                <BrainCircuit className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">2. LLM</span>
              </TabsTrigger>
              <TabsTrigger value="delivery" className="rounded-lg font-mono text-xs uppercase data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
                <Send className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">3. Delivery</span>
              </TabsTrigger>
              <TabsTrigger value="validator" className="rounded-lg font-mono text-xs uppercase data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">4. Policy</span>
              </TabsTrigger>
              <TabsTrigger value="review" className="rounded-lg font-mono text-xs uppercase data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
                <Eye className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">5. Review</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sources" className="mt-0 outline-none">
              <SourcesTab form={form} />
            </TabsContent>
            
            <TabsContent value="llm" className="mt-0 outline-none">
              <LlmTab form={form} />
            </TabsContent>
            
            <TabsContent value="delivery" className="mt-0 outline-none">
              <DeliveryTab form={form} />
            </TabsContent>
            
            <TabsContent value="validator" className="mt-0 outline-none">
              <ValidatorLoggingTab form={form} />
            </TabsContent>
            
            <TabsContent value="review" className="mt-0 outline-none">
              <ReviewTab form={form} configId={configId} />
            </TabsContent>
          </Tabs>

          {/* Sticky bottom navigation bar */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur border-t z-10 flex justify-center">
            <div className="w-full max-w-4xl flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBack} 
                disabled={activeTab === 'sources'}
                className="w-32"
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              
              {activeTab === 'review' ? (
                <Button type="submit" disabled={isPending} className="w-32 bg-primary text-primary-foreground hover:bg-primary/90">
                  {isPending ? (
                    <span className="flex items-center">
                      <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                      Saving...
                    </span>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Save
                    </>
                  )}
                </Button>
              ) : (
                <Button type="button" onClick={handleNext} className="w-32 bg-primary text-primary-foreground hover:bg-primary/90">
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
