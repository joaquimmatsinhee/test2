const FALLBACK =
  'postgresql://neondb_owner:npg_my9MGUxd5rNc@ep-broad-lake-b526gxc3-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    },
  });
}

export async function onRequestGet(context) {
  try {
    const dbUrl = (context.env.NEON_DATABASE_URL || context.env.DATABASE_URL || FALLBACK).replace(
      /&channel_binding=[^&]+/g,
      ''
    );
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(dbUrl);
    const rows = await sql`
      SELECT id, telegram_group_url, updated_at
      FROM app_settings
      WHERE id = 'default'
      LIMIT 1
    `;
    return json({ success: true, settings: rows?.[0] || null });
  } catch (err) {
    return json({ success: false, error: err.message || String(err) }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
