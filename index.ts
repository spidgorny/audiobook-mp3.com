import axios from 'axios';


// const url = 'https://xp4stm90bvzr.frontroute.org/s02/images/audiobooks/6/6/0/2/6602.pl.txt';
// const res = await axios.get(url);
// const pl = res.data;
// console.log(pl);
import * as Path from "path";
import * as Fs from "fs";
// import pLimit from 'p-limit';

// const limit = pLimit(3);

async function getSize(url: string) {
    // console.log('OPTIONS', url);
    const response = await axios({
        url,
        method: 'OPTIONS',
        headers: {
            Referer: 'https://audiobook-mp3.com/',
            range: 'bytes=0-1'
        }
    });
    // console.log(response.headers);
    // content-range': 'bytes 0-1/2661969
    return parseInt(response.headers['content-range'].split('/')[1])
}

async function downloadImage(url: string, path: string) {
    const size = await getSize(url);
    let stats = Fs.existsSync(path) ? Fs.statSync(path) : {size: 0};
    // console.log(path, stats)
    const fileSize = stats?.size ?? 0;
    // console.log({size, fileSize})

    if (size === fileSize) {
        return;
    }

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
        headers: {
            'Referer': 'https://audiobook-mp3.com/'
        }
    })

    const writer = Fs.createWriteStream(path)
    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(true))
        writer.on('error', reject)
    })
}

async function downloadFile(x: { file: string; title: string }, title: string) {
    try {
        const file = x.file;
        const folder = title;
        if (!Fs.existsSync(folder)) {
            Fs.mkdirSync(folder);
        }
        const uUrl = new URL(file);
        const path = Path.resolve(__dirname, folder, Path.basename(uUrl.pathname));
        console.log('*', Path.basename(path));
        const dl = await downloadImage(file, path);
        if (dl) {
            console.log(file, 'done');
        }
    } catch (e) {
        const err = e as Error;
        console.error(x.file, err.message);
    }
}

async function main() {
    const pl = JSON.parse(Fs.readFileSync("./pl.json").toString());
    console.log('files', pl.length);
    // await Promise.all(pl.map(async (x: { file: string, title: string }) =>
        // limit(() => downloadFile(x, pl[0].title))
    // ))
    for await (let x of pl) {
        await downloadFile(x, pl[0].title)
    }
}

main();
