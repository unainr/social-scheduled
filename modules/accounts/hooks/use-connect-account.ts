import { useMutation } from "@tanstack/react-query";
import type { InferRequestType, InferResponseType } from "hono";
import { toast } from "sonner";
import { client } from "@/lib/hono";

type ResponseType = InferResponseType<
  typeof client.api.accounts.connect.$post,
  201
>;
type RequestType = InferRequestType<
  typeof client.api.accounts.connect.$post
>["json"];
export const useConnectAccount = () => {
  return useMutation<ResponseType["data"]["url"], Error, RequestType>({
    mutationFn: async ({ platform }) => {
      const res = await client.api.accounts.connect.$post({
        json: { platform },
      });
      const json = await res.json();

     

      return json.data;
    },
    onSuccess: (data) => {
      // redirect to Zernio OAuth
      window.location.href = data;
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
