// pixelflood

const net = require('net');
const jimp = require('jimp');
const { exit } = require('process');
const port = 1337; //1234;
const host = '94.45.233.1'; //'flood.schenklflut.de';

function rgbToPixelFlood(x, y, r, g, b) {
    // every color has to be 2 digits hex, so #fefefe => r: fe, g: fe, b: fe

    // pixel flood format: "PX x y rr gg bb"
    const red = r.toString(16).padStart(2, '0');
    const green = g.toString(16).padStart(2, '0');
    const blue = b.toString(16).padStart(2, '0');

    const pixel = `PX ${x} ${y} ${red}${green}${blue}\n`;
    return pixel;
}

function generatePixels(origin_x, origin_y, width, height, color) {
    let pixels = '';

    for (let y = origin_y; y < origin_y + height; y++) {
        for (let x = origin_x; x < origin_x + width; x++) {
            pixels += rgbToPixelFlood(x, y, color.r, color.g, color.b);
        }
    }

    return pixels;
}

async function imageToPixels(origin_x, origin_y, path) {
    let pixels = '';
    const image = await jimp.read(path);
    const width = image.bitmap.width;
    const height = image.bitmap.height;

    console.log(width, height)
    
    for (let wi = 0; wi < width; wi++) {
        for (let hi = 0; hi < height; hi++) {
            const color = jimp.intToRGBA(image.getPixelColor(wi, hi));
            const pixel = rgbToPixelFlood(origin_x + wi, origin_y + hi, color.r, color.g, color.b);
            pixels += pixel;
        }
    }

    return pixels;
}

// const image = generatePixels(0, 0, 50, 50, { r: 255, g: 0, b: 0 });
// load jpg and convert into pixel flood
async function exec() {
    console.log('Preparing to send image to pixel flood...');
    const image = await imageToPixels(0, 0, './bobbylogo.jpg');
    console.log('Starting clients...');

    const image1 = generatePixels(0, 0, 500, 500, { r: 255, g: 0, b: 0 });
    const image2 = generatePixels(0, 0, 200, 200, { r: 0, g: 255, b: 0 });
    const image3 = generatePixels(0, 0, 200, 200, { r: 0, g: 0, b: 255 });

    // multiple clients
    const clients = [];
    let clientCount = 10;

    for (let i = 0; i < clientCount; i++) {
        const client = net.connect({ port, host }, () => {
            console.log(`Client ${i} connected`);
        });

        client.on('error', (err) => {
            client.connect(port, host);
        });

        clients.push(client);
    }


    setInterval(() => {
        for (let client of clients) {
            // check if buffer is full
            if (client.canSend)
                client.write(image);
        }
    }, 0);

    setInterval(() => {
        for (let client of clients) {
            client.canSend = (client.bufferSize < 1000000000);
        }
    }, 100);
}

exec();
