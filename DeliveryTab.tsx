import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';
import { ConfigInputFormValues } from '@/lib/schemas';
import { AgentConfigTarget } from '@workspace/api-client-react';

interface DeliveryTabProps {
  form: UseFormReturn<ConfigInputFormValues>;
}

export default function DeliveryTab({ form }: DeliveryTabProps) {
  const target = form.watch('data.target');

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl">Patch Delivery</CardTitle>
        <CardDescription>
          Where should the agent output the remediated code or configurations?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="data.target"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Target</FormLabel>
              <Select onValueChange={(val) => {
                field.onChange(val);
                // Initialize default structures based on target
                if (val === AgentConfigTarget.github && !form.getValues('data.github')) {
                  form.setValue('data.github', { owner: '', repo: '', baseBranch: 'main' });
                } else if (val === AgentConfigTarget.gitlab && !form.getValues('data.gitlab')) {
                  form.setValue('data.gitlab', { project: '', baseBranch: 'main' });
                }
              }} value={field.value}>
                <FormControl>
                  <SelectTrigger className="font-mono">
                    <SelectValue placeholder="Select target" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={AgentConfigTarget.local}>Local File System</SelectItem>
                  <SelectItem value={AgentConfigTarget.github}>GitHub Pull Request</SelectItem>
                  <SelectItem value={AgentConfigTarget.gitlab}>GitLab Merge Request</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="p-6 bg-muted/30 border rounded-lg space-y-6">
          <FormField
            control={form.control}
            name="data.output.dir"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local Workspace Directory</FormLabel>
                <FormControl>
                  <Input placeholder="./workspace/patches" className="font-mono" {...field} />
                </FormControl>
                <FormDescription>
                  Even when delivering to remote Git targets, the agent needs a local working directory.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {target === AgentConfigTarget.github && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold text-sm">GitHub Configuration</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="data.github.owner"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Organization / Owner</FormLabel>
                      <FormControl>
                        <Input placeholder="my-org" className="font-mono" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data.github.repo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repository</FormLabel>
                      <FormControl>
                        <Input placeholder="infrastructure" className="font-mono" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data.github.baseBranch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Branch</FormLabel>
                      <FormControl>
                        <Input placeholder="main" className="font-mono" {...field} value={field.value || 'main'} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Alert className="bg-background/50 text-muted-foreground border-dashed">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Agent requires <code className="bg-muted px-1 rounded">GITHUB_TOKEN</code> environment variable to be set at runtime for PR creation. Tokens are never stored in the configuration file.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {target === AgentConfigTarget.gitlab && (
            <div className="space-y-4 pt-4 border-t">
              <h4 className="font-semibold text-sm">GitLab Configuration</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="data.gitlab.project"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Path</FormLabel>
                      <FormControl>
                        <Input placeholder="my-org/infrastructure" className="font-mono" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data.gitlab.baseBranch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Branch</FormLabel>
                      <FormControl>
                        <Input placeholder="main" className="font-mono" {...field} value={field.value || 'main'} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="data.gitlab.baseUrl"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Base URL (Self-managed)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://gitlab.example.com" className="font-mono" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormDescription>Leave empty for gitlab.com</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Alert className="bg-background/50 text-muted-foreground border-dashed">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Agent requires <code className="bg-muted px-1 rounded">GITLAB_TOKEN</code> environment variable to be set at runtime.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
