var fs = require('fs');
var $ = require('node-jquery');

var items = {};

function processFile(filename, output, property, callback)
{
    fs.readFile(filename, 'utf8', function(error, file)
    {
        if(error)
        {
            return console.log(error);
        }

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

                output[item_id][property] = item_value;
            }
        }

        if(typeof callback == "function")
            callback();
    });
}

processFile('grf/idnum2itemdisplaynametable.txt', items, 'name', function()
{
    processFile('grf/idnum2itemdesctable.txt', items, 'desc', function()
    {
        console.log(items);
    });
});
