import { EnrichedRecord } from './types';
import { defaultStatus } from './config';

const records: EnrichedRecord[] = [];

const resolvers = {
  Query: {
    enrichedRecord: (_: unknown, { id }: { id: string }) =>
      records.find((r) => r.id === id) || null,
  },
  Mutation: {
    enrich: (_: unknown, { data }: { data: string }) => {
      const record: EnrichedRecord = {
        id: String(Date.now()),
        data,
        status: defaultStatus,
      };
      records.push(record);
      return record;
    },
  },
};

export default resolvers;
