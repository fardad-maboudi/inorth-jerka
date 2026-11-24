/**
 * Data hooks for generated pages — import from '@/api/hooks'.
 *
 * Pages use these instead of `useEffect` + `useState` or a raw `useQuery`.
 * Query keys are built here, so cache sharing and invalidation stay correct;
 * a mutation refreshes every list/record of the same plugin (or entity).
 * Errors are the `createJoorchinError` shape (`message` is safe to render).
 * A `QueryClientProvider` is mounted by the platform in `main.jsx`.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  APP_ID,
  createEntity,
  createPluginRecord,
  deleteEntity,
  deletePluginRecord,
  getEntity,
  getPluginRecord,
  listEntities,
  listPluginRecords,
  updateEntity,
  updatePluginRecord,
} from '@/api/joorchin';

const STALE_MS = 30_000;

/** @typedef {Record<string, unknown>} DataRow */
/** @typedef {{filter?: Record<string, unknown>, sort?: string, limit?: number, skip?: number}} ListParams */
/** @typedef {{enabled?: boolean}} HookOptions */
/** @template T @typedef {{data: T|undefined, error: Error|null, isLoading: boolean, isPending: boolean, isError: boolean, isFetching: boolean, isSuccess: boolean, refetch: Function}} QueryState */
/** @template T @typedef {T[] & {items: T[], total: number}} RowsResult */
/** @template {string} P @template {string} E @typedef {import('./joorchin.js').PluginRow<P, E>} PluginRowOf */
/** @template [T=Record<string, unknown>] @typedef {{action: 'create', data: Partial<T>} | {action: 'update', id: string, data: Partial<T>} | {action: 'delete', id: string}} MutationVars */
/** @template [T=Record<string, unknown>] @typedef {{mutate: (vars: MutationVars<T>, callbacks?: {onSuccess?: (data: unknown) => void, onError?: (error: Error) => void}) => void, mutateAsync: (vars: MutationVars<T>) => Promise<unknown>, isPending: boolean, isError: boolean, error: Error|null, reset: Function}} MutationState */

/** Stable key prefixes. Exported so a page can invalidate by hand if it must.
 * @type {{plugin: (pluginId: string) => unknown[], pluginList: (pluginId: string, entity: string, params?: ListParams) => unknown[], pluginRecord: (pluginId: string, entity: string, id: string) => unknown[], entity: (entity: string) => unknown[], entityList: (entity: string, params?: ListParams) => unknown[], entityRecord: (entity: string, id: string) => unknown[]}}
 */
export const queryKeys = {
  plugin: (pluginId) => ['joorchin', APP_ID, 'plugin', pluginId],
  pluginList: (pluginId, entity, params) => [
    ...queryKeys.plugin(pluginId),
    entity,
    'list',
    params ?? {},
  ],
  pluginRecord: (pluginId, entity, id) => [
    ...queryKeys.plugin(pluginId),
    entity,
    'record',
    id,
  ],
  entity: (entity) => ['joorchin', APP_ID, 'entity', entity],
  entityList: (entity, params) => [...queryKeys.entity(entity), 'list', params ?? {}],
  entityRecord: (entity, id) => [...queryKeys.entity(entity), 'record', id],
};

/**
 * Rows of a plugin collection (product, category, post, …). Row fields are
 * typed for known plugin entities: `usePluginList('reviews', 'review')`.
 * @template {string} P @template {string} E
 * @param {P} pluginId @param {E} entity @param {ListParams} [params] @param {HookOptions} [options]
 * @returns {QueryState<RowsResult<PluginRowOf<P, E>>>}
 *   `data` is the row array (also `.items` / `.total`).
 * @example
 * const { data: reviews, isLoading, error } = usePluginList('reviews', 'review', { limit: 10 });
 * if (isLoading) return <Skeletons />;
 * if (error) return <ErrorState message={error.message} />;
 */
export function usePluginList(pluginId, entity, params, options = {}) {
  return useQuery({
    queryKey: queryKeys.pluginList(pluginId, entity, params),
    queryFn: () => listPluginRecords(pluginId, entity, params),
    staleTime: STALE_MS,
    enabled: options.enabled ?? true,
  });
}

/** One plugin record. Disabled until `id` is set.
 * @template {string} P @template {string} E
 * @param {P} pluginId @param {E} entity @param {string|undefined} id @param {HookOptions} [options]
 * @returns {QueryState<PluginRowOf<P, E>>}
 */
export function usePluginRecord(pluginId, entity, id, options = {}) {
  return useQuery({
    queryKey: queryKeys.pluginRecord(pluginId, entity, id),
    queryFn: () => getPluginRecord(pluginId, entity, id),
    staleTime: STALE_MS,
    enabled: (options.enabled ?? true) && Boolean(id),
  });
}

/**
 * Create/update/delete a plugin record; refreshes the plugin's cached reads.
 * `mutate({ action: 'create', data })`, `{ action: 'update', id, data }`,
 * `{ action: 'delete', id }`.
 * @template {string} P @template {string} E
 * @param {P} pluginId @param {E} entity
 * @returns {MutationState<PluginRowOf<P, E>>}
 * @example
 * const save = usePluginMutation('reviews', 'review');
 * save.mutate({ action: 'create', data: { rating: 5, comment: 'عالی' } });
 */
export function usePluginMutation(pluginId, entity) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ action, id, data }) => {
      if (action === 'create') return createPluginRecord(pluginId, entity, data);
      if (action === 'update') return updatePluginRecord(pluginId, entity, id, data);
      if (action === 'delete') return deletePluginRecord(pluginId, entity, id);
      throw new Error(`Unknown mutation action: ${action}`);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.plugin(pluginId) }),
  });
}

/** Rows of an app entity collection (the site's own data models). Pass a row
 * type for typed fields: `useEntityList<{ title: string }>('todo')`.
 * @template {Record<string, unknown>} [T=DataRow]
 * @param {string} entity @param {ListParams} [params] @param {HookOptions} [options]
 * @returns {QueryState<RowsResult<T>>}
 * @example
 * const { data: todos } = useEntityList('todo', { sort: '-created_at', limit: 20 });
 */
export function useEntityList(entity, params, options = {}) {
  return useQuery({
    queryKey: queryKeys.entityList(entity, params),
    queryFn: () => listEntities(entity, params),
    staleTime: STALE_MS,
    enabled: options.enabled ?? true,
  });
}

/** One app entity row. Disabled until `id` is set.
 * @template {Record<string, unknown>} [T=DataRow]
 * @param {string} entity @param {string|undefined} id @param {HookOptions} [options]
 * @returns {QueryState<T>}
 */
export function useEntity(entity, id, options = {}) {
  return useQuery({
    queryKey: queryKeys.entityRecord(entity, id),
    queryFn: () => getEntity(entity, id),
    staleTime: STALE_MS,
    enabled: (options.enabled ?? true) && Boolean(id),
  });
}

/** Create/update/delete an entity row; refreshes the entity's cached reads.
 * @template {Record<string, unknown>} [T=DataRow]
 * @param {string} entity
 * @returns {MutationState<T>}
 * @example
 * const todos = useEntityMutation('todo');
 * todos.mutate({ action: 'update', id: todo._id, data: { done: true } });
 */
export function useEntityMutation(entity) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ action, id, data }) => {
      if (action === 'create') return createEntity(entity, data);
      if (action === 'update') return updateEntity(entity, id, data);
      if (action === 'delete') return deleteEntity(entity, id);
      throw new Error(`Unknown mutation action: ${action}`);
    },
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.entity(entity) }),
  });
}
