# Admin App Guide: Product Images (Supabase Storage + `product_media`)

## What this enables
This store supports multiple images per product.

- Images are stored in Supabase Storage bucket: `product-media` (public read)
- Image metadata + ordering is stored in Postgres table: `public.product_media`
- The storefront reads `product_media` first, then falls back to `products.images` if needed

## Storage bucket & path convention
**Bucket:** `product-media`

**Object path format (required by RLS + our seed logic):**
```
{tenant_id}/{product_id}/{filename}
```

- `tenant_id` is a UUID string (example: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)
- `product_id` is the UUID from `public.products.id` (example: `d1000000-0000-0000-0000-000000000001`)
- `filename` can be anything (recommended: `{timestamp}-{random}.{ext}`)

## Database table: `public.product_media`
The migration creates:

- `id uuid primary key`
- `product_id uuid` (FK -> `public.products.id`)
- `storage_bucket text` (defaults to `product-media`)
- `storage_path text` (the exact object path in Storage)
- `position int` (ordering)
- `alt_text text` (optional)
- `is_primary boolean` (primary image)
- `created_at timestamptz`

Notes:
- `storage_bucket + storage_path` is unique.
- Prefer **exactly one** row per product with `is_primary = true`.

## Migration applied in Supabase
Migration name:
- `create_product_media`

It does:
- Creates table + indexes + RLS policies
- Seeds `product_media` from existing `storage.objects` in bucket `product-media` **when** the second folder segment is a valid UUID that matches `products.id`.

## Admin app workflow (recommended)
### 1) Upload the file to Storage
Upload the image to the `product-media` bucket using the path convention above.

### 2) Insert a `product_media` row
Insert a row pointing to the uploaded object.

### 3) Set ordering + primary
- Set `is_primary=true` on the main image
- Use `position=0..n` for ordering

### 4) (Optional) Remove/replace images
When deleting an image:
- Delete the `product_media` row
- Delete the corresponding Storage object

## SQL examples
### Insert a new image
```sql
insert into public.product_media (
  product_id,
  storage_bucket,
  storage_path,
  position,
  alt_text,
  is_primary
)
values (
  'PRODUCT_UUID_HERE',
  'product-media',
  'TENANT_UUID/PRODUCT_UUID/1730000000000-abc123.webp',
  0,
  'Miel de Jujubier (Sidr)',
  true
);
```

### Ensure only one primary image per product
```sql
update public.product_media
set is_primary = false
where product_id = 'PRODUCT_UUID_HERE';

update public.product_media
set is_primary = true
where id = 'PRODUCT_MEDIA_ROW_UUID_HERE';
```

### Reorder images
```sql
update public.product_media
set position = 0
where id = 'ROW_UUID_1';

update public.product_media
set position = 1
where id = 'ROW_UUID_2';
```

## Admin app (supabase-js) example (TypeScript)
```ts
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function uploadProductImage(params: {
  tenantId: string;
  productId: string;
  file: File;
  makePrimary?: boolean;
  position?: number;
  altText?: string;
}) {
  const { tenantId, productId, file } = params;
  const makePrimary = params.makePrimary ?? false;
  const position = params.position ?? 0;
  const altText = params.altText ?? null;

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storagePath = `${tenantId}/${productId}/${filename}`;

  const { error: uploadError } = await supabase.storage
    .from("product-media")
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (uploadError) throw uploadError;

  if (makePrimary) {
    await supabase
      .from("product_media")
      .update({ is_primary: false })
      .eq("product_id", productId);
  }

  const { data, error } = await supabase
    .from("product_media")
    .insert({
      product_id: productId,
      storage_bucket: "product-media",
      storage_path: storagePath,
      position,
      alt_text: altText,
      is_primary: makePrimary,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data;
}
```

## Troubleshooting
- If images don’t render in the storefront, confirm:
  - The Storage object is in `product-media`
  - The object path matches `{tenant_id}/{product_id}/...`
  - A `product_media` row exists for that `product_id`
  - The image URL is public (bucket is public)
  - Next.js `next.config.ts` allows the Supabase hostname for `next/image`

## Notes about RLS
- Storage bucket `product-media` is **public read**.
- Upload/update/delete is restricted to authenticated users that own the `{tenant_id}` folder (via `tenant_owners`).
- `product_media` is public SELECT (storefront can read) and authenticated tenant owners can manage rows.
