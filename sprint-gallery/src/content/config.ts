import { defineCollection, z } from 'astro:content';

const foundations = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    key: z.enum(['color', 'typography', 'spacing', 'radius', 'motion', 'elevation']),
    description: z.string(),
    tokenSource: z.string(),
    order: z.number().default(99),
  }),
});

const components = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    key: z.string().regex(/^[a-z0-9-]+$/),
    category: z.enum(['layout', 'nav', 'surface', 'control', 'feedback']),
    status: z.enum(['stable', 'draft']).default('draft'),
    figmaFrame: z.string().url().optional(),
    tokens: z.array(z.string()).default([]),
    variants: z.array(
      z.object({
        name: z.string(),
        purpose: z.string(),
      }),
    ).default([]),
    states: z.array(
      z.object({
        name: z.string(),
        rule: z.string(),
      }),
    ).default([]),
    relatedComponents: z.array(z.string()).default([]),
    demoFile: z.string().optional(),
  }),
});

const patterns = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    key: z.string().regex(/^[a-z0-9-]+$/),
    purpose: z.string(),
    usesComponents: z.array(z.string()).default([]),
    figmaFrame: z.string().url().optional(),
  }),
});

export const collections = { foundations, components, patterns };
