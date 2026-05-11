import type { AxiosError } from "axios";
import { onUnmounted, provide, ref, watch } from "vue";
import type { AsyncResponse } from "@/types/interface";

type RequestFunction<T> = () => Promise<AsyncResponse<T>>;
type Callback<T> = (res: AsyncResponse<T>) => void;

export function useApiRequest<T>(provideValues = true) {
  const response = ref();
  const pending = ref(false);
  const error = ref("");
  const dirty = ref(false);

  if (provideValues) {
    provide("pending", pending);
    provide("error", error);
  }

  function send(
    request: RequestFunction<T>,
    cb?: Callback<T>,
    remove = false,
    beforeResolve = false
  ) {
    if (typeof request != "function")
      return Promise.reject(new Error("can not be called. not a function"));

    pending.value = true;
    error.value = "";

    if (remove) {
      response.value = null;
    }
    // return new Promise((resolve, reject) => {
    dirty.value = true;
    return request()
      .then((res) => {
        if (beforeResolve) cb && cb(res);

        pending.value = false;

        response.value = res?.data;
        error.value = res?.error || "";

        if (typeof cb == "function") cb(res);

        return res;
      })
      .catch((err: any) => {
        console.error(err);
        pending.value = false;
        error.value = err?.message ?? "";
        throw err;
      });
    // });
  }

  function reset() {
    dirty.value = false;
    response.value = null;
    pending.value = false;
    error.value = "";
  }

  return {
    response,
    send,
    pending,
    error,
    dirty,
    reset,
  };
}
