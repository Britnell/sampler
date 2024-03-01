import type { APIRoute } from "astro";
import list from "../../../scrape/all.json";

export const GET: APIRoute = () => {
  const r = Math.floor(list.length * Math.random());
  const li = list[r];

  return new Response("", {
    status: 302,
    headers: {
      Location: li.href,
    },
  });
  return new Response(JSON.stringify(li), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
