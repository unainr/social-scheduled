import { client } from "@/lib/hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";

type ResponseType = InferResponseType<
  typeof client.api.accounts.disconnect.$post,
  200
>;
type RequestType = InferRequestType<
  typeof client.api.accounts.disconnect.$post
>["json"];
export const useDisconnectAccount = () => {
  const qc = useQueryClient();
  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ accountId }) => {
      const res = await client.api.accounts.disconnect.$post({
        json: { accountId },
      });
      const json = await res.json();

      if (!res.ok) throw new Error("Failed to disconnect account");

      return json;
    },
    onSuccess: () => {
      // redirect to Zernio OAuth
      qc.invalidateQueries({ queryKey: ["accounts"] });
      toast.success("Account disconnected");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
