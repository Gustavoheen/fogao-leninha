import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Mock no-op client when Supabase credentials are not configured
function createMockClient() {
  const noopPromise = Promise.resolve({ data: null, error: null })
  const chain = {
    select: () => chain,
    insert: () => chain,
    update: () => chain,
    delete: () => chain,
    upsert: () => chain,
    eq: () => chain,
    order: () => chain,
    single: () => chain,
    then: (resolve) => noopPromise.then(resolve),
    catch: (reject) => noopPromise.catch(reject),
  }
  const mockChannel = {
    on: () => mockChannel,
    subscribe: () => mockChannel,
  }
  return {
    from: () => chain,
    channel: () => mockChannel,
    removeChannel: () => {},
  }
}

export const supabase = (url && key)
  ? createClient(url, key)
  : createMockClient()

export const supabaseConfigured = !!(url && key)
