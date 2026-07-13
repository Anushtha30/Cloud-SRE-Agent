import { useListConfigs, useDeleteConfig, useGenerateConfigYaml, getListConfigsQueryKey } from '@workspace/api-client-react';
import { Link } from 'wouter';
import { format } from 'date-fns';
import { Shield, Plus, Edit, Trash2, Download, Terminal, Database, Server, GitMerge, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from 'react';

export default function Dashboard() {
  const { data: configs, isLoading } = useListConfigs();
  const deleteConfig = useDeleteConfig();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    deleteConfig.mutate({ id }, {
      onSuccess: () => {
        toast({ title: 'Configuration deleted' });
        queryClient.invalidateQueries({ queryKey: getListConfigsQueryKey() });
      },
      onError: (err) => {
        const msg = (err as { data?: { error?: string } })?.data?.error || (err as Error)?.message || 'Unknown error';
        toast({ title: 'Failed to delete', description: msg, variant: 'destructive' });
      }
    });
  };

  const handleDownloadYaml = async (id: number) => {
    setDownloadingId(id);
    try {
      // Direct fetch since we are handling this via a button click and don't want a reactive useQuery
      const res = await fetch(`/api/configs/${id}/yaml`);
      if (!res.ok) throw new Error('Failed to download YAML');
      const data = await res.json();
      
      const blob = new Blob([data.yaml], { type: 'text/yaml' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = data.filename || `config-${id}.yaml`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      toast({ title: 'Download failed', description: err.message, variant: 'destructive' });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Configurations</h1>
          <p className="text-muted-foreground">Manage Cloud SRE Agent deployments and policies</p>
        </div>
        <Link href="/configs/new" className="hidden sm:inline-flex">
          <Button className="font-mono text-sm shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Create Configuration
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="flex flex-col">
              <CardHeader>
                <Skeleton className="h-6 w-2/3 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="flex-grow">
                <Skeleton className="h-4 w-1/2 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : configs && configs.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {configs.map((config) => (
            <Card key={config.id} className="flex flex-col hover-elevate transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                    <Terminal className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    {config.name}
                  </CardTitle>
                </div>
                {config.description && (
                  <CardDescription className="line-clamp-2 mt-1.5">{config.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="flex-grow pb-3">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider bg-background/50">
                      Target: {config.target}
                    </Badge>
                    <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider">
                      {config.llmProvider} / {config.llmModel}
                    </Badge>
                  </div>
                  
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-2">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                    Updated {format(new Date(config.updatedAt), 'MMM d, yyyy HH:mm')}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-3 border-t bg-muted/20 flex gap-2 justify-between">
                <div className="flex gap-1">
                  <Link href={`/configs/${config.id}/edit`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleDownloadYaml(config.id)}
                    disabled={downloadingId === config.id}
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download YAML</span>
                  </Button>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Configuration?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the configuration "{config.name}". This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(config.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">No Configurations Found</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Create an SRE Agent configuration to start analyzing logs and auto-remediating incidents.
            </p>
            <Link href="/configs/new">
              <Button className="font-mono shadow-sm">
                <Plus className="mr-2 h-4 w-4" />
                Create Configuration
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
