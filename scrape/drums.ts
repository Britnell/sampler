import * as cheerio from "cheerio";
import { sozai } from "./test";

function load() {
  const $ = cheerio.load(sozai);
  const sources: string[] = [];
  $("audio").each((_, el) => {
    const audio = $(el);
    const src = audio.attr("src");
    if (src) sources.push(src);
    //
    // console.log(x, el);
  });
}
load();
