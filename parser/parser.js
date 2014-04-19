var fs = require('fs');
var $ = require('node-jquery');
var sanitizeHtml = require('sanitize-html');

var items = {};
var colors = {length: 0, nonblack: 0};

function getMatches(string, regex, index) {
    index || (index = 1); // default to the first capturing group
    var matches = [];
    var match;
    while (match = regex.exec(string)) {
        matches.push(match[index]);
    }
    return matches;
}

// Process ragnarok pound seperated tables 
function processFile(filename, output, property, callback)
{
    fs.readFile(filename, 'utf8', function(error, file)
    {
        if(error)
        {
            return console.log(error);
        }

        var matches = getMatches(file, /(\^[0-9a-f]{6})/gi);

        $.each(matches, function(index, match)
        {
            if(typeof colors[match] == "undefined")
            {
                colors[match] = 0;
                colors.length++;
            }

            colors[match]++;

            if(match != "^000000")
                colors.nonblack++;
        });

        // Remove comments
        var data = file.replace(/\/\/.*/g, '');
        data = data.replace(/\/-.*/g, '');

        // Split into array
        data = data.split("#");

        // Iterate over array, incrimenting by two
        for(var i = 0; i < data.length; i += 2)
        {
            var item_id = $.trim(data[i]);

            // Oh no! Our item ID isn't a number... 
            if(isNaN(item_id))
            {
                // Incriment i and try to continue?
                i++;
                continue;
            }
            
            var item_value = $.trim(data[i+1]);

            if(item_id && item_value)
            {
                if(typeof output[item_id] == "undefined")
                    output[item_id] = {};

                output[item_id][property] = ro2html(item_value);
            }
        }

        if(typeof callback == "function")
            callback();
    });
}

// Convert ragnarok markup to HTML
function ro2html(string)
{
    string = string.replace(/\r/g, '');
    string = string.replace(/\n/g, '<br>');
    string = string.replace(/(\^[0-9a-f]{6})/gi, function(color)
    {
        color = color.substr(1);
        return '<span style="color: #'+color+'">';
    });

    string = string.replace(/<span style="color: #000000">/g, '</span>');

    string = sanitizeHtml(string, {
        allowedTags: ['span', 'br'],
        allowedAttributes: {'span': ['style']}
    });

    return string;
}

processFile('grf/idnum2itemdisplaynametable.txt', items, 'name', function()
{
    processFile('grf/idnum2itemdesctable.txt', items, 'desc', function()
    {
        console.log(items);
        console.log(colors);
    });
});
