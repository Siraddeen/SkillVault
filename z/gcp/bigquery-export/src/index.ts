import { createClient } from "@supabase/supabase-js";
import { BigQuery } from "@google-cloud/bigquery";

const BATCH_SIZE = 500;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const bigquery = new BigQuery({ projectId: process.env.GCP_PROJECT_ID });
const dataset = bigquery.dataset(process.env.BQ_DATASET!);

async function exportTable(tableName: "telemetry_events" | "ad_impressions") {
  const { data: rows, error } = await supabase
    .from(tableName)
    .select("*")
    .is("exported_at", null)
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    console.error(`[${tableName}] fetch error:`, error.message);
    return;
  }

  if (!rows || rows.length === 0) {
    console.log(`[${tableName}] nothing to export`);
    return;
  }

  const table = dataset.table(tableName);

  try {
    await table.insert(
      rows.map(({ exported_at, ...rest }) => rest),
      { skipInvalidRows: false, ignoreUnknownValues: false },
    );
  } catch (err: any) {
    // BigQuery partial-failure errors land in err.errors
    console.error(
      `[${tableName}] BQ insert failed:`,
      err.errors ?? err.message,
    );
    return; // don't mark as exported — retry next run
  }

  const ids = rows.map((r) => r.id);
  const { error: updateError } = await supabase
    .from(tableName)
    .update({ exported_at: new Date().toISOString() })
    .in("id", ids);

  if (updateError) {
    console.error(
      `[${tableName}] failed to mark exported:`,
      updateError.message,
    );
    return;
  }

  console.log(`[${tableName}] exported ${rows.length} rows`);
}

async function main() {
  await exportTable("telemetry_events");
  await exportTable("ad_impressions");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("export job failed:", err);
    process.exit(1);
  });
