var fs = require('fs');
var $ = require('node-jquery');
var sanitizeHtml = require('sanitize-html');
var csv = require('csv');

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

                // Text processing oh boy
                item_value = ro2html(item_value);
                item_value = name_fixer(item_value);

                // Why does it have to feel so dirty
                var extracted = weight_extractor(item_value);
                if(extracted)
                {
                    item_value = extracted.result;
                    output[item_id].weight = extracted.weight;
                }

                output[item_id][property] = item_value;
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
    string = string.replace(/\^[0-9a-f]{6}/gi, function(color)
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

// Those pesky weights!
function weight_extractor(string)
{
    var weight = false;
    
    string = string.replace(/Weight : <span style="color: #777777">\s?([0-9]+)\s?<\/span>/gi, function(text, number)
    {                        
        weight = parseInt(number);

        // Remove the weight from our original text
        return '';
    }); 

    if(weight !== false)
    {
        return {
            result: string,
            weight: weight
        };
    }

    return false;
}

// Fix item names
function name_fixer(string)
{
    // Item names don't have spaces!
    if(string.indexOf(' ') == -1)
    {
        return string.replace(/_/g, ' ');
    }

    return string;
};

function processType(filename, callback)
{
    fs.readFile(filename, 'utf8', function(error, file)
    {
        if(error)
        {
            return console.log(error);
        }

        // Remove comments and windows newlines
        file = file.replace(/\/\/.*/g, '');
        file = file.replace(/\r/g, '\n');

        csv().from.string(file).to.array(function(data, count)
        {
            for(var i = 0; i < count; i++)
            {                
                if(typeof items[data[i][0]] != "undefined")
                    items[data[i][0]].type = data[i][3];
            }

            if(typeof callback == "function")
                callback();
        })
    });
}

processFile('grf/idnum2itemdisplaynametable.txt', items, 'name', function()
{
    processFile('grf/idnum2itemdesctable.txt', items, 'desc', function()
    {
        processType('eAthena/item_db.txt', function()
        {
      //    console.log(JSON.stringify(items));
        console.log(items);
//        console.log(colors);

        });        
    });
});
