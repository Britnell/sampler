import type { APIRoute } from "astro";
import list from "../../../scrape/all.json";

const loclabs = "https://citizen-dj.labs.loc.gov";

export const GET: APIRoute = () => {
  const r = Math.floor(list.length * Math.random());
  const { href } = list[r];
  const isFull = href.startsWith("http");
  const link = isFull ? href : loclabs + href;

  return new Response("", {
    status: 302,
    headers: {
      Location: link,
    },
  });
  // return new Response(JSON.stringify(li), {
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  // });
};
