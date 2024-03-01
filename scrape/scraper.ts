import { getPageFiles, listCollections } from "./parts";
// import { pageHtml } from "./test";

const collections = listCollections();
console.log(collections.map((c, x) => ({ ...c, x })));

const loclabs = "https://citizen-dj.labs.loc.gov";

declare var Bun: any;

const getPage = async (x: number) => {
  const url = loclabs + collections[x].href;
  const page = await fetch(url).then((res) => res.text());
  const files = getPageFiles(page);
  console.log(x, url, files.length);

  const file = Bun.file(`./scrape/${collections[x].name}.txt`);
  await Bun.write(file, JSON.stringify(files));
};

// for (let x = 0; x < collections.length; x++) {
//   getPage(x);
//   await delay(2000);
// }

function delay(x: number) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(null), x);
  });
}

const getFileList = async (name: string) => {
  const file = Bun.file(name);
  const str = await file.text();
  try {
    const data = JSON.parse(str);
    return data;
  } catch (e) {
    return [];
  }
};

const combine = async () => {
  const lists = await Promise.all(txts.map((txt) => getFileList(txt)));
  const combine = lists.reduce((t, list) => [...t, ...list], []);
  const file = Bun.file(`./scrape/all.txt`);
  await Bun.write(file, JSON.stringify(combine));

  //   const xlist = await getFileList(txts[x]);
};

const txts = [
  "./scrape/American English Dialect Recordings.txt",
  "./scrape/The National Jukebox: Jazz.txt",
  "./scrape/Free Music Archive.txt",
  "./scrape/The National Jukebox: Musical Theater.txt",
  "./scrape/Inventing Entertainment.txt",
  "./scrape/The National Jukebox: Opera.txt",
  "./scrape/MusicBox Project.txt",
  "./scrape/The National Jukebox: Popular Music.txt",
  "./scrape/The Joe Smith Collection.txt",
  "./scrape/The National Screening Room.txt",
  "./scrape/The National Jukebox: Blues.txt",
  "./scrape/Tony Schwartz Collection.txt",
  "./scrape/The National Jukebox: Classical Music.txt",
  "./scrape/Variety Stage Sound Recordings and Motion Pictures.txt",
  "./scrape/The National Jukebox: Folk Music.txt",
];

combine();
