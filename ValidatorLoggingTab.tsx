import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfigInputFormValues } from '@/lib/schemas';
import { AgentConfigValidator, LogConfigLevel, LogConfigFormat, TracingConfigExporter } from '@workspace/api-client-react';

interface ValidatorLoggingTabProps {
  form: UseFormReturn<ConfigInputFormValues>;
}

export default function ValidatorLoggingTab({ form }: ValidatorLoggingTabProps) {
  const tracingExporter = form.watch('data.tracing.exporter');

  return (
    <div className="space-y-8">
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Validation Policy</CardTitle>
          <CardDescription>
            Configure how the agent validates generated patches before delivery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="data.validator"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Validation Strategy</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="font-mono">
                      <SelectValue placeholder="Select validation strategy" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={AgentConfigValidator.none}>None (Skip Validation)</SelectItem>
                    <SelectItem value={AgentConfigValidator.local}>Local Execution (Go/Terraform/etc)</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Local execution will attempt to run syntax checks or test suites on the generated code.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Logging</CardTitle>
            <CardDescription>Agent daemon log output settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="data.log.level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Log Level</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="font-mono">
                        <SelectValue placeholder="Select log level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={LogConfigLevel.debug}>DEBUG</SelectItem>
                      <SelectItem value={LogConfigLevel.info}>INFO</SelectItem>
                      <SelectItem value={LogConfigLevel.warn}>WARN</SelectItem>
                      <SelectItem value={LogConfigLevel.error}>ERROR</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="data.log.format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Format</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="font-mono">
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={LogConfigFormat.json}>JSON (Structured)</SelectItem>
                      <SelectItem value={LogConfigFormat.text}>Text (Human Readable)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Distributed Tracing</CardTitle>
            <CardDescription>OTel trace export configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="data.tracing.exporter"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Exporter</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="font-mono">
                        <SelectValue placeholder="Select exporter" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={TracingConfigExporter.none}>None Disabled</SelectItem>
                      <SelectItem value={TracingConfigExporter.stdout}>Stdout</SelectItem>
                      <SelectItem value={TracingConfigExporter.cloudtrace}>Google Cloud Trace</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tracingExporter === TracingConfigExporter.cloudtrace && (
              <div className="p-4 bg-muted/30 border rounded-lg">
                <FormField
                  control={form.control}
                  name="data.tracing.project"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GCP Project ID</FormLabel>
                      <FormControl>
                        <Input placeholder="my-tracing-project" className="font-mono" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
