import { z } from 'zod';
import { 
  LogSourceType, 
  LlmConfigProvider, 
  LlmConfigBackend, 
  AgentConfigTarget, 
  AgentConfigValidator, 
  LogConfigLevel, 
  LogConfigFormat, 
  TracingConfigExporter,
  LlmFallbackKind,
  LlmFallbackBackend
} from '@workspace/api-client-react';

export const logSourceSchema = z.object({
  type: z.enum([LogSourceType.file, LogSourceType.pubsub]),
  path: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  subscriptionId: z.string().optional().nullable(),
});

export const llmFallbackSchema = z.object({
  kind: z.enum([LlmFallbackKind.gemini, LlmFallbackKind.openai, LlmFallbackKind.anthropic, LlmFallbackKind.ollama, LlmFallbackKind.stub]),
  model: z.string().min(1, "Model is required"),
  backend: z.enum([LlmFallbackBackend.vertex, LlmFallbackBackend["gemini-api"]]).optional().nullable(),
  project: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  apiKeyEnv: z.string().optional().nullable(),
  baseUrl: z.string().optional().nullable(),
  host: z.string().optional().nullable(),
});

export const llmConfigSchema = z.object({
  provider: z.enum([LlmConfigProvider.gemini, LlmConfigProvider.openai, LlmConfigProvider.anthropic, LlmConfigProvider.ollama, LlmConfigProvider.stub]),
  model: z.string().min(1, "Model is required"),
  backend: z.enum([LlmConfigBackend.vertex, LlmConfigBackend["gemini-api"]]).optional().nullable(),
  project: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  apiKeyEnv: z.string().optional().nullable(),
  allowNonBaa: z.boolean().default(false),
  allowExternal: z.boolean().default(false),
  baseUrl: z.string().optional().nullable(),
  host: z.string().optional().nullable(),
  fallbacks: z.array(llmFallbackSchema).default([]),
});

export const outputConfigSchema = z.object({
  dir: z.string().min(1, "Output directory is required"),
});

export const githubConfigSchema = z.object({
  owner: z.string().optional().nullable(),
  repo: z.string().optional().nullable(),
  baseBranch: z.string().min(1, "Base branch is required"),
});

export const gitlabConfigSchema = z.object({
  project: z.string().optional().nullable(),
  baseBranch: z.string().min(1, "Base branch is required"),
  baseUrl: z.string().optional().nullable(),
});

export const logConfigSchema = z.object({
  level: z.enum([LogConfigLevel.debug, LogConfigLevel.info, LogConfigLevel.warn, LogConfigLevel.error]),
  format: z.enum([LogConfigFormat.json, LogConfigFormat.text]),
});

export const tracingConfigSchema = z.object({
  exporter: z.enum([TracingConfigExporter.none, TracingConfigExporter.stdout, TracingConfigExporter.cloudtrace]),
  project: z.string().optional().nullable(),
});

export const agentConfigSchema = z.object({
  sources: z.array(logSourceSchema).min(1, "At least one source is required"),
  llm: llmConfigSchema,
  output: outputConfigSchema,
  target: z.enum([AgentConfigTarget.local, AgentConfigTarget.github, AgentConfigTarget.gitlab]),
  github: githubConfigSchema.optional(),
  gitlab: gitlabConfigSchema.optional(),
  validator: z.enum([AgentConfigValidator.none, AgentConfigValidator.local]),
  log: logConfigSchema,
  tracing: tracingConfigSchema,
});

export const configInputSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  data: agentConfigSchema,
});

export type ConfigInputFormValues = z.infer<typeof configInputSchema>;
