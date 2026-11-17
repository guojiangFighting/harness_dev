/**
 * Minimal persona plugin: contributes a system-prompt section.
 * Replace this with your domain persona (role, workflow, constraints).
 *
 * API: ctx.systemPrompt.section({ name, order, text })
 */
export const name = 'hello-persona'
export const inject = ['systemPrompt']

export function apply(ctx) {
  const order = typeof ctx.systemPrompt.getSectionOrder === 'function'
    ? ctx.systemPrompt.getSectionOrder('DEPLOYMENT_PERSONA_PREFIX') + 10
    : 100

  ctx.systemPrompt.section({
    name: 'custom-persona',
    order,
    text: [
      'You are a custom agent scaffold running on dsh-base.',
      'Replace hello-persona / hello-tool with your own plugins.',
      'Stay within the user-authorized scope of the current session.',
    ].join(' '),
  })
}
