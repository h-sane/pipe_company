export async function GET() {
  return Response.json({
    databaseUrlPresent: Boolean(process.env.DATABASE_URL),
    databaseUrlHost: process.env.DATABASE_URL?.split("@")[1],
    nodeEnv: process.env.NODE_ENV,
    runtime: process.env.NEXT_RUNTIME ?? "node-default"
  })
}