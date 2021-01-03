const googleTranslate = require('@vitalets/google-translate-api');
const fs = require("fs");

const settings = JSON.parse(fs.readFileSync("settings.json").toString());

translateAll();
async function translateAll() {
    await translate(settings.gameText);
    await translate(settings.storyText);
}

async function translate(file) {
    let src = settings.inDir + "/" + file;
    let out = settings.outDir + "/" + file;
    if (fs.existsSync(src)) {
        if (!fs.existsSync(settings.outDir)) {
            // create output directory
            fs.mkdirSync(settings.outDir, {
                recursive: true
            });
        } else if (fs.existsSync(out)) {
            // delete output file
            fs.unlinkSync(out);
        }
        console.log("-- Translating " + src + " --");

        let text = fs.readFileSync(src, settings.format).toString();
        let result = "";
        for (let line of text.split("\n")) {
            // ignore lines with variables etc.
            if (line.indexOf("~~~") >= 0 || line.indexOf("Text File :") >= 0 || line.indexOf("[") >= 0) {
                result += line;
            } else {
                let ret = "";
                // replace the line based on formatting codes as we want to ignore those
                for (let part of line.split(/(?=\\\w)/g)) {
                    // put formatting code in result
                    if (part.startsWith("\\")) {
                        ret += part.substring(0, 2);
                        part = part.substring(2);
                        // if this part was just the formatting code, continue
                        if (part.length <= 0)
                            continue;
                    }

                    // translate through all the languages
                    for (let lang of settings.languages) {
                        part = (await googleTranslate(part, {
                            to: lang
                        })).text;
                    }
                    ret += part;
                }
                console.log("Translated " + line + " to " + ret);
                result += ret;
            }
            result += "\n";
        }
        fs.writeFileSync(out, result, settings.format);
    }
}