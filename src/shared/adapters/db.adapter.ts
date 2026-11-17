'use client';
import { AxiosAdapter } from "./axios.adapter";

export const DbAdapter = new AxiosAdapter({
  baseUrl: process.env.NEXT_PUBLIC_API_URL!,
  params: {},
});
