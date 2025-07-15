import { z } from 'zod';

export const agentSchema = z.object({
  name: z.string().min(1, 'name is required'),
  description: z.string().optional(),
});

export type Agent = z.infer<typeof agentSchema>;
