import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";
import { client } from "@/lib/hono";

type ResponseType = InferResponseType<typeof client.api.schedule.$post, 201>;
type RequestType = InferRequestType<typeof client.api.schedule.$post>["json"];

export const useCreateScheduledPost = () => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const res = await client.api.schedule.$post({ json });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.message ?? "Failed to schedule post");
      }

      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.success("Post scheduled");
    },
    onError: (error) => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.error(error.message);
    },
  });
};
