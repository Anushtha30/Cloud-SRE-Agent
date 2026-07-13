import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, configsTable } from "@workspace/db";
import {
  CreateConfigBody,
  UpdateConfigBody,
  GetConfigParams,
  UpdateConfigParams,
  DeleteConfigParams,
  GenerateConfigYamlParams,
} from "@workspace/api-zod";

const router = Router();

// GET /configs — list all configs
router.get("/configs", async (req, res) => {
  const configs = await db
    .select({
      id: configsTable.id,
      name: configsTable.name,
      description: configsTable.description,
      data: configsTable.data,
      createdAt: configsTable.createdAt,
      updatedAt: configsTable.updatedAt,
    })
    .from(configsTable)
    .orderBy(configsTable.updatedAt);

  const summaries = configs.map((c) => {
    const data = c.data as Record<string, unknown>;
    const llm = (data.llm || {}) as Record<string, unknown>;
    return {
      id: c.id,
      name: c.name,
      description: c.description ?? null,
      target: (data.target as string) || "local",
      llmProvider: (llm.provider as string) || "gemini",
      llmModel: (llm.model as string) || "",
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    };
  });

  res.json(summaries);
});

// POST /configs — create config
router.post("/configs", async (req, res) => {
  const parsed = CreateConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, description, data } = parsed.data;

  const [created] = await db
    .insert(configsTable)
    .values({
      name,
      description: description ?? null,
      data: data as Record<string, unknown>,
    })
    .returning();

  res.status(201).json({
    id: created.id,
    name: created.name,
    description: created.description ?? null,
    data: created.data,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  });
});

// GET /configs/:id — get config
router.get("/configs/:id", async (req, res) => {
  const parsed = GetConfigParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [config] = await db
    .select()
    .from(configsTable)
    .where(eq(configsTable.id, parsed.data.id))
    .limit(1);

  if (!config) {
    res.status(404).json({ error: "Config not found" });
    return;
  }

  res.json({
    id: config.id,
    name: config.name,
    description: config.description ?? null,
    data: config.data,
    createdAt: config.createdAt.toISOString(),
    updatedAt: config.updatedAt.toISOString(),
  });
});

// PUT /configs/:id — update config
router.put("/configs/:id", async (req, res) => {
  const paramsParsed = UpdateConfigParams.safeParse(req.params);
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const bodyParsed = UpdateConfigBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: bodyParsed.error.message });
    return;
  }

  const { name, description, data } = bodyParsed.data;

  const [updated] = await db
    .update(configsTable)
    .set({
      name,
      description: description ?? null,
      data: data as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(configsTable.id, paramsParsed.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Config not found" });
    return;
  }

  res.json({
    id: updated.id,
    name: updated.name,
    description: updated.description ?? null,
    data: updated.data,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  });
});

// DELETE /configs/:id — delete config
router.delete("/configs/:id", async (req, res) => {
  const parsed = DeleteConfigParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [deleted] = await db
    .delete(configsTable)
    .where(eq(configsTable.id, parsed.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Config not found" });
    return;
  }

  res.status(204).send();
});

// GET /configs/:id/yaml — generate YAML
router.get("/configs/:id/yaml", async (req, res) => {
  const parsed = GenerateConfigYamlParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [config] = await db
    .select()
    .from(configsTable)
    .where(eq(configsTable.id, parsed.data.id))
    .limit(1);

  if (!config) {
    res.status(404).json({ error: "Config not found" });
    return;
  }

  const yaml = configToYaml(config.data as Record<string, unknown>, config.name);
  const slug = config.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const filename = `${slug}-config.yaml`;

  res.json({ yaml, filename });
});

// Escape a YAML scalar value — quote strings that contain special chars
function yamlScalar(value: string): string {
  if (!value) return "''";
  // If value contains special YAML chars, colons, hashes, or starts with special
  if (/[:#\[\]{},&*?|<>=!%@`]/.test(value) || /^\s|\s$/.test(value) || value.includes('\n')) {
    return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
  }
  return value;
}

function configToYaml(data: Record<string, unknown>, name: string): string {
  const lines: string[] = [];

  lines.push(`# Cloud SRE Agent Configuration: ${yamlScalar(name)}`);
  lines.push(`# Generated by SRE Agent UI`);
  lines.push(`#`);
  lines.push(`# Environment overrides use the SRE_ prefix with __ for nesting`);
  lines.push(`# e.g. SRE_LLM__MODEL=gemini-2.5-pro -> llm.model`);
  lines.push(``);

  const s = (v: unknown): string => yamlScalar(String(v ?? ""));

  // Sources
  lines.push(`sources:`);
  const sources = (data.sources as Array<Record<string, unknown>>) || [];
  for (const source of sources) {
    lines.push(`  - type: ${source.type}`);
    if (source.type === "file" && source.path) {
      lines.push(`    path: ${s(source.path)}`);
    }
    if (source.type === "pubsub") {
      if (source.projectId) lines.push(`    project_id: ${s(source.projectId)}`);
      if (source.subscriptionId) lines.push(`    subscription_id: ${s(source.subscriptionId)}`);
    }
  }
  lines.push(``);

  // LLM
  const llm = (data.llm as Record<string, unknown>) || {};
  lines.push(`llm:`);
  lines.push(`  provider: ${llm.provider}`);
  lines.push(`  model: ${s(llm.model)}`);

  if (llm.provider === "gemini") {
    if (llm.backend) lines.push(`  backend: ${llm.backend}`);
    if (llm.backend === "vertex") {
      if (llm.project) lines.push(`  project: ${s(llm.project)}`);
      if (llm.location) lines.push(`  location: ${s(llm.location)}`);
    }
    if (llm.backend === "gemini-api") {
      if (llm.apiKeyEnv) lines.push(`  api_key_env: ${s(llm.apiKeyEnv)}`);
    }
    if (llm.allowNonBaa) lines.push(`  allow_non_baa: true`);
  }
  if (llm.provider === "openai" || llm.provider === "anthropic") {
    if (llm.baseUrl) lines.push(`  base_url: ${s(llm.baseUrl)}`);
    if (llm.allowExternal) lines.push(`  allow_external: true`);
  }
  if (llm.provider === "ollama" && llm.host) {
    lines.push(`  host: ${s(llm.host)}`);
  }

  const fallbacks = (llm.fallbacks as Array<Record<string, unknown>>) || [];
  if (fallbacks.length > 0) {
    lines.push(`  fallbacks:`);
    for (const fb of fallbacks) {
      lines.push(`    - kind: ${fb.kind}`);
      lines.push(`      model: ${s(fb.model)}`);
      if (fb.kind === "gemini") {
        if (fb.backend) lines.push(`      backend: ${fb.backend}`);
        if (fb.project) lines.push(`      project: ${s(fb.project)}`);
        if (fb.location) lines.push(`      location: ${s(fb.location)}`);
        if (fb.apiKeyEnv) lines.push(`      api_key_env: ${s(fb.apiKeyEnv)}`);
      }
      if ((fb.kind === "openai" || fb.kind === "anthropic") && fb.baseUrl) {
        lines.push(`      base_url: ${s(fb.baseUrl)}`);
      }
      if (fb.kind === "ollama" && fb.host) {
        lines.push(`      host: ${s(fb.host)}`);
      }
    }
  }
  lines.push(``);

  // Output
  const output = (data.output as Record<string, unknown>) || {};
  lines.push(`output:`);
  lines.push(`  dir: ${s(output.dir || "./out")}`);
  lines.push(``);

  // Target
  lines.push(`target: ${data.target}`);
  lines.push(``);

  if (data.target === "github") {
    const github = (data.github as Record<string, unknown>) || {};
    lines.push(`github:`);
    if (github.owner) lines.push(`  owner: ${s(github.owner)}`);
    if (github.repo) lines.push(`  repo: ${s(github.repo)}`);
    lines.push(`  base_branch: ${s(github.baseBranch || "main")}`);
    lines.push(``);
  }

  if (data.target === "gitlab") {
    const gitlab = (data.gitlab as Record<string, unknown>) || {};
    lines.push(`gitlab:`);
    if (gitlab.project) lines.push(`  project: ${s(gitlab.project)}`);
    lines.push(`  base_branch: ${s(gitlab.baseBranch || "main")}`);
    if (gitlab.baseUrl) lines.push(`  base_url: ${s(gitlab.baseUrl)}`);
    lines.push(``);
  }

  // Validator
  lines.push(`validator: ${data.validator || "none"}`);
  lines.push(``);

  // Log
  const log = (data.log as Record<string, unknown>) || {};
  lines.push(`log:`);
  lines.push(`  level: ${log.level || "info"}`);
  lines.push(`  format: ${log.format || "json"}`);
  lines.push(``);

  // Tracing
  const tracing = (data.tracing as Record<string, unknown>) || {};
  lines.push(`tracing:`);
  lines.push(`  exporter: ${tracing.exporter || "none"}`);
  if (tracing.exporter === "cloudtrace" && tracing.project) {
    lines.push(`  project: ${s(tracing.project)}`);
  }

  return lines.join("\n");
}

export default router;
