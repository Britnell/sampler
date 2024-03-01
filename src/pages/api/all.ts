import type { APIRoute } from "astro";
import list from "../../../scrape/all.json";

export const GET: APIRoute = () => {
  return new Response(JSON.stringify(list), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
