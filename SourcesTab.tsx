import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, FileText, Rss } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfigInputFormValues } from '@/lib/schemas';
import { LogSourceType } from '@workspace/api-client-react';

interface SourcesTabProps {
  form: UseFormReturn<ConfigInputFormValues>;
}

export default function SourcesTab({ form }: SourcesTabProps) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "data.sources"
  });

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Log Sources</CardTitle>
        <CardDescription>
          Configure where the agent should ingest telemetry and logs from.
          The sliding-window detector will analyze these streams in real-time.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {fields.map((field, index) => {
          const sourceType = form.watch(`data.sources.${index}.type`);
          
          return (
            <div key={field.id} className="relative p-6 bg-muted/30 border rounded-lg group">
              {fields.length > 1 && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-2 top-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name={`data.sources.${index}.type`}
                  render={({ field: selectField }) => (
                    <FormItem>
                      <FormLabel>Source Type</FormLabel>
                      <Select onValueChange={selectField.onChange} defaultValue={selectField.value}>
                        <FormControl>
                          <SelectTrigger className="font-mono">
                            <SelectValue placeholder="Select a source type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={LogSourceType.file}>
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-2" />
                              Local File
                            </div>
                          </SelectItem>
                          <SelectItem value={LogSourceType.pubsub}>
                            <div className="flex items-center">
                              <Rss className="h-4 w-4 mr-2 text-primary" />
                              GCP Pub/Sub
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {sourceType === LogSourceType.file && (
                  <FormField
                    control={form.control}
                    name={`data.sources.${index}.path`}
                    render={({ field: inputField }) => (
                      <FormItem>
                        <FormLabel>File Path</FormLabel>
                        <FormControl>
                          <Input placeholder="/var/log/syslog" className="font-mono" {...inputField} value={inputField.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {sourceType === LogSourceType.pubsub && (
                  <>
                    <FormField
                      control={form.control}
                      name={`data.sources.${index}.projectId`}
                      render={({ field: inputField }) => (
                        <FormItem>
                          <FormLabel>GCP Project ID</FormLabel>
                          <FormControl>
                            <Input placeholder="my-gcp-project" className="font-mono" {...inputField} value={inputField.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`data.sources.${index}.subscriptionId`}
                      render={({ field: inputField }) => (
                        <FormItem>
                          <FormLabel>Subscription ID</FormLabel>
                          <FormControl>
                            <Input placeholder="agent-telemetry-sub" className="font-mono" {...inputField} value={inputField.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}

        <Button 
          type="button" 
          variant="outline" 
          className="w-full border-dashed"
          onClick={() => append({ type: LogSourceType.file, path: '' })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Source
        </Button>
      </CardContent>
    </Card>
  );
}
