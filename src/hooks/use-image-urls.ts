import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Resolve stored storage object paths (e.g. "product-images/<uid>/<file>.jpg")
 * into short-lived signed URLs. Buckets are private, so every image is served
 * through a signed URL. Results are cached per path set for an hour.
 */
export function useSignedImageUrls(paths: string[] | null | undefined): Record<string, string> {
  const key = (paths ?? []).join("|");

  const query = useQuery({
    queryKey: ["signed-urls", key],
    enabled: (paths ?? []).length > 0,
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    queryFn: async () => {
      const byBucket = new Map<string, string[]>();
      for (const p of paths ?? []) {
        const slash = p.indexOf("/");
        if (slash <= 0) continue;
        const bucket = p.slice(0, slash);
        const objectPath = p.slice(slash + 1);
        if (!objectPath) continue;
        const existing = byBucket.get(bucket);
        if (existing) existing.push(objectPath);
        else byBucket.set(bucket, [objectPath]);
      }
      const resolved: Record<string, string> = {};
      for (const [bucket, objectPaths] of byBucket) {
        const { data, error } = await supabase.storage
          .from(bucket)
          .createSignedUrls(objectPaths, 60 * 60 * 24 * 6);
        if (error) continue;
        for (const item of data ?? []) {
          if (item.signedUrl) resolved[`${bucket}/${item.path}`] = item.signedUrl;
        }
      }
      return resolved;
    },
  });

  return query.data ?? {};
}

export function useSignedImageUrl(path: string | null | undefined): string | null {
  const map = useSignedImageUrls(path ? [path] : []);
  return path ? map[path] ?? null : null;
}
