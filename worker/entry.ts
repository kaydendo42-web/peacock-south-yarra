import app from 'vinext/server/fetch-handler'

/**
 * The site, plus the 9pm dinner pickup list. Vercel's cron called
 * /api/dinners/digest with the cron secret; Cloudflare's Cron Triggers call
 * `scheduled`, which makes the same request. The route itself checks it is
 * 9pm in Melbourne, so the two UTC schedules cover daylight saving.
 */
export default {
  ...app,
  async scheduled(_event: ScheduledController, env: Record<string, string>, ctx: ExecutionContext) {
    const request = new Request(`${env.SITE_URL}/api/dinners/digest`, {
      headers: { authorization: `Bearer ${env.CRON_SECRET}` },
    })
    ctx.waitUntil(app.fetch(request, env, ctx))
  },
} satisfies ExportedHandler<Record<string, string>>
