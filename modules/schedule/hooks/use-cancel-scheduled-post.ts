import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";
import { client } from "@/lib/hono";

type ResponseType = InferResponseType<
  typeof client.api.schedule.delete.$post,
  200
>;
type RequestType = InferRequestType<
  typeof client.api.schedule.delete.$post
>["json"];

export const useCancelScheduledPost = () => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async (json) => {
      const res = await client.api.schedule.delete.$post({ json });
      const body = await res.json();

      if (!res.ok) {
        throw new Error(body.message ?? "Failed to cancel post");
      }

      return body;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
      toast.success("Post canceled");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
