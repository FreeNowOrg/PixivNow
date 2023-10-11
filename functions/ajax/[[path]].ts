import { EventContext } from '@cloudflare/workers-types'
import { handleHttpRequest } from '../modules/http'

interface Env {}

export async function onRequest(
  ctx: EventContext<Env, any, any>
): Promise<Response> {
  ctx.params.prefix = 'ajax'
  return handleHttpRequest(ctx)
}
