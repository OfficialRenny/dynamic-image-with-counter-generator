'use strict';
const express = require('express');
const fs = require('fs');
const cors = require('cors');

var countFile = fs.readFileSync('count.json');
var countJson = JSON.parse(countFile);

var count = countJson["count"];

const app = express();
const port = 2020;

const Jimp = require('jimp');


const staticFolder = express.static('public');

// runs GenImage() if a static file is accessed + some CORS stuff - copied from stack overflow so not quite sure how it works but it does
app.use(cors(), function (req, res, next) {
    function staticReqNotifier() {
        GenImage();
    }
    req.on("end", staticReqNotifier);
    staticFolder(req, res, (err) => {
        req.off("end", staticReqNotifier);
        next(err);
    });
});

// handles a response for regular requests
app.get('*',
    function (req, res) {
        res.sendStatus(418);        
    }
);

app.listen(port, () => console.log("Now listening on " + port));

// here's where the magic happens
async function GenImage() {
    try {
        count += 1;
		// sets the two lines of text
        var firstLine = `Current Profile View Count`;
        var secondLine = count.toLocaleString();
		
		// variables for a small margin, loading the included BMFont and a limit on the width of the image
        var margin = 6;
        var fontLoaded = await Jimp.loadFont('./oxanium.fnt');
        var maxWidth = 460;
		
		// gets the heights of the text in pixels of both of the lines with a bit of margin on the sides
        var firstLineHeight = Jimp.measureTextHeight(fontLoaded, firstLine, maxWidth - (margin * 2));
        var secondLineHeight = Jimp.measureTextHeight(fontLoaded, secondLine, maxWidth - (margin * 2));
		
		// uses the two heights to create a fully transparent image that should fit both lines of text
        var image = await new Jimp(maxWidth, (firstLineHeight + margin + secondLineHeight) + (margin * 2), 0x00000000);
		
		// writes the text to the image, second line takes the height of the first line into consideration
        await image.print(fontLoaded, margin, margin, { text: firstLine, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_TOP }, image.bitmap.width - (margin * 2));
        await image.print(fontLoaded, margin, margin + firstLineHeight, { text: secondLine, alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER, alignmentY: Jimp.VERTICAL_ALIGN_TOP }, image.bitmap.width - (margin * 2));
		
		// writes the image to file
        await image.writeAsync('./public/counter.png');
		
		// updates counts.json every 5 views in case server is closed down
        if (count % 5 == 0) {
            countJson["count"] = count;
            fs.writeFileSync('count.json', JSON.stringify(countJson));
        }
    } catch (e) {
		// logs errors i guess?
        if (e.message) {
            console.log(e)
        } else console.log(e);
    }
}