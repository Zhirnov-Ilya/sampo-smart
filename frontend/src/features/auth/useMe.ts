import { useQuery } from "@tanstack/react-query";

import { getMeRequest } from "../../api/auth";


export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMeRequest,
    retry: false,
  });
}