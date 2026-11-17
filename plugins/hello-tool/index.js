/**
 * Minimal tool plugin template.
 *
 * NOTE: This stub only logs registration so the scaffold boots without
 * depending on @deepseek-ai/dsh-tools types at edit time.
 * When you develop for real, rewrite with:
 *
 *   import { defineTool } from '@deepseek-ai/dsh-tools'
 *   ctx.tools.register(defineTool({ name, description, parameters, output, execute }))
 */
export const name = 'hello-tool'
export const inject = ['tools']

export function apply(ctx) {
  // Soft check: if tools service is present, register a tiny no-op via raw API
  // when available; otherwise just prove the plugin loaded.
  const tools = ctx.tools
  if (tools && typeof tools.register === 'function') {
    try {
      // Prefer defineTool in production plugins. Raw register shape varies by version;
      // keep this scaffold non-fatal if APIs differ.
      ctx.logger?.info?.('[hello-tool] tools service ready — replace this plugin with defineTool(...)')
    } catch {
      // ignore
    }
  }
  ctx.logger?.info?.('[hello-tool] plugin loaded')
  console.log('[hello-tool] plugin loaded — replace with your defineTool registrations')
}
