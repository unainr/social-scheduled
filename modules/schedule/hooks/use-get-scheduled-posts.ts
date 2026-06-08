import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";

export const useScheduledPosts = () => {
  return useQuery({
    queryKey: ["scheduled-posts"],
    queryFn: async () => {
      const res = await client.api.schedule.$get();
      if (!res.ok) throw new Error("Failed to fetch scheduled posts");

      const json = await res.json();
      return json.data;
    },
  });
};
