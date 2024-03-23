import * as cheerio from "cheerio";
import { collectionsHtml } from "./test";

export const listCollections = () => {
  const $ = cheerio.load(collectionsHtml);
  const list: any[] = [];
  $("#collection-select")
    .children()
    .each((_, el) => {
      const li = $(el).find("a");
      const href = li.attr("href");
      const name = li.text();
      list.push({ href, name });
    });
  return list;
};

export const getPageFiles = (html: string) => {
  const $ = cheerio.load(html);
  const list: object[] = [];
  $("ul.preview-list")
    .children()
    .each((_, el) => {
      //   if (x > 10) return;
      const li = $(el);
      const href = li.find("a:contains('details')").attr("href");
      const name = li.find("h4").text();
      list.push({ href, name });
    });
  return list;
};
