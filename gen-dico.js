const fs = require("fs");
const http = require("https");

function downloadFile(url, dest) {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(dest, "utf-8");
    http.get(url, function (response) {
      response.pipe(file);

      // after download completed close filestream
      file.on("finish", () => {
        file.close();
        resolve();
      });
    });
  });
}

downloadFile(
  "https://raw.githubusercontent.com/Taknok/French-Wordlist/master/francais.txt",
  "gen/liste_francais.txt"
).then(() => {
  const data = fs.readFileSync("gen/liste_francais.txt", "utf8");

  const words = data
    .split("\n")
    .map((word) => word.trim())
    .filter((word) => word.length === 5)
    .filter((word) => word.charAt(0).toUpperCase() !== word.charAt(0))
    .map((word) => {
      return word
        .replace(/[éèêë]/g, "e")
        .replace(/[îï]/g, "i")
        .replace(/ô/g, "o")
        .replace(/â/g, "a")
        .replace(/û/g, "u")
        .replace(/ç/g, "c");
    })
    // .filter((word) => {
    //   return !/[éàêîèùôûâïë]/.test(word);
    // })
    .map((word) => word.toUpperCase());
  fs.writeFileSync("gen/words_fr.json", JSON.stringify(words));
});
